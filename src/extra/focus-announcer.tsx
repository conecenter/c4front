import React, { useRef, ReactNode, useEffect, useState, useCallback, createContext } from 'react';
import { PatchSyncTransformers, usePatchSync } from './exchange/patch-sync';
import { useAddEventListener, useIsMounted } from './custom-hooks';
import { SEL_FOCUS_FRAME, VISIBLE_CHILD_SELECTOR, FOCUS_BLOCKER_CLASS } from './css-selectors';
import { identityAt } from '../main/vdom-util';

/*
- Focus change cases:
    1) to element with ancestor having 'data-path'
        -- focus REPORT NEW PATH
    2) to element without ancestor having 'data-path' - FocusAnnouncerElement wraps UI
        -- focus: path = FocusAnnouncerElement path
    3) is lost (focused element removed)
        -- no focus event
        -- blur: to == null, from doesn't exist after timeout --> findAutoFocus
    4) - focus goes from top window to iframe
       - focus goes from iframe to top window
       - focus goes to browser tools
        -- blur: to == null, from exists -- do nothing
*/

const PathContext = createContext("path");
PathContext.displayName = "PathContext";

type RegisterFocusCandidate = (node: HTMLElement | null) => void
const FocusRestoreCandidateCtx = createContext<RegisterFocusCandidate>(() => undefined);
FocusRestoreCandidateCtx.displayName = "FocusRestoreCandidateCtx";

const receiverIdOf = identityAt('receiver');

const patchSyncTransformers: PatchSyncTransformers<string, string, string> = {
    serverToState: s => s,
    changeToPatch: (ch) => ({
        headers: {"x-r-action": "change"},
        value: ch
    }),
    patchToChange: (p) => p.value,
    applyChange: (_prev, ch) => ch
};

const getFocusFramePath = (elem?: Element | null) => elem?.closest<HTMLElement>(SEL_FOCUS_FRAME)?.dataset.path;

interface FocusAnnouncerElement {
    identity: object,
    path: string,
    value: string,
    children: ReactNode
}

function FocusAnnouncerElement({ identity, path: thisPath, value: serverValue, children }: FocusAnnouncerElement) {
    const [doc, setDoc] = useState<Document | undefined>(undefined);
    const setupDoc = useCallback((elem: HTMLDivElement) => setDoc(elem?.ownerDocument), []);

    const { currentState: value, sendFinalChange } =
        usePatchSync(receiverIdOf(identity), serverValue, true, patchSyncTransformers);

    const sendChange = (path: string) => path !== value && sendFinalChange(path);

    function focusElementOrBackup(elem: HTMLElement | null | undefined) {
        const focusTo = elem || findAutofocusCandidate(doc);
        if (focusTo) focusTo.focus();
        else sendChange('');
    }

    useReportPathOnFocus(doc, thisPath, sendChange);

    const registerFocusCandidate = usePreventFocusLoss(doc, value, focusElementOrBackup);

    useAlignFocusWithServerValue(doc, value, focusElementOrBackup);

    const focusFrameStyle = `
        .focusWrapper[data-path='${value}'],
        .focusFrameProvider:has([data-path='${value}']) {
            outline-style: dashed;
        }
    `;

    return (
        <div
            ref={setupDoc}
            className='focusAnnouncer'
            tabIndex={-1}
            data-path={thisPath}
        >
            <style>{focusFrameStyle}</style>
            <PathContext.Provider value={value}>
                <FocusRestoreCandidateCtx.Provider value={registerFocusCandidate}>
                    {children}
                </FocusRestoreCandidateCtx.Provider>
            </PathContext.Provider>
        </div>
    );
}

function useIsFocusedView(doc: Document | undefined) {
    const isFocusedViewRef = useRef(false);
    useEffect(() => {
        isFocusedViewRef.current = isRootBranch(doc)
    }, [doc]);
    useAddEventListener(doc, 'focusin', () => { isFocusedViewRef.current = true });
    useAddEventListener(doc, 'focusout', () => { isFocusedViewRef.current = false });
    return isFocusedViewRef;
}

function usePreventFocusLoss(
    doc: Document | undefined,
    focusPath: string,
    focusElementOrBackup: (elem: HTMLElement | null | undefined) => void
) {
    const isMountedRef = useIsMounted();
    const focusCandidateRef = useRef<HTMLElement | null>(null);

    const registerFocusCandidate = useCallback((node: HTMLElement | null) => {
        focusCandidateRef.current = node;
        setTimeout(() => focusCandidateRef.current = null);
    }, []);

    function onBlur(e: FocusEvent) {
        if (e.relatedTarget !== null || isNavTransition()) return;
        const target = e.target as HTMLElement | null;
        const focusableAncestors = getFocusableAncestors(target);
        queueMicrotask(() => {  // microtask to let react finish commit and remove DOM node
            if (shouldRestoreFocus(doc, target, focusPath) && isMountedRef.current) {
                const focusTo = focusCandidateRef.current || focusableAncestors.find((elem) => elem.isConnected);
                focusElementOrBackup(focusTo);
            }
        });
    }
    useAddEventListener(doc, 'focusout', onBlur);

    return registerFocusCandidate;
}

function shouldRestoreFocus(doc: Document | undefined, target: HTMLElement | null, focusPath: string) {
    const hasNoFocusedElement = () => !doc?.activeElement || doc.activeElement.tagName === 'BODY';
    const hasValidPendingFocus = () => Boolean(doc?.querySelector<HTMLElement>(`[data-path='${focusPath}']`));
    if (!doc?.hasFocus()) return false;
    if (target?.isConnected) return false;
    if (!hasNoFocusedElement()) return false;
    if (hasValidPendingFocus()) return false;
    return true;
}

function useReportPathOnFocus(
    doc: Document | undefined,
    thisPath: string,
    sendChange: (path: string) => void
) {
    function onFocus(e: FocusEvent) {
        const newPath = getFocusFramePath(e.target as Element) || thisPath;
        if (newPath) sendChange(newPath);
    }
    useAddEventListener(doc, 'focusin', onFocus, true);
}

function useAlignFocusWithServerValue(
    doc: Document | undefined,
    value: string,
    focusElementOrBackup: (elem: HTMLElement | null | undefined) => void
) {
    const isFocusedViewRef = useIsFocusedView(doc);
    useEffect(() => {
        if (!isFocusedViewRef.current || isNavTransition()) return;
        if (!value) return findAutofocusCandidate(doc)?.focus();
        const activeElem = doc?.activeElement;
        const activeElemPath = getFocusFramePath(activeElem);
        if (activeElemPath !== value) {
            const elemToFocus = doc?.querySelector<HTMLElement>(`[data-path='${value}']${VISIBLE_CHILD_SELECTOR}`);
            focusElementOrBackup(elemToFocus);
        }
    });
}

function isRootBranch(doc: Document | undefined) {
    return doc ? doc.defaultView === doc.defaultView?.parent : false;
}

function findAutofocusCandidate(doc: Document | undefined) {
    const hasFocusBlocker = Boolean(doc?.querySelector(`.${FOCUS_BLOCKER_CLASS}`));
    if (hasFocusBlocker) return null;
    return findFirstElementInViewport(doc, 'input') || findFirstElementInViewport(doc, SEL_FOCUS_FRAME)
        || doc?.querySelector<HTMLElement>('input');
}

function findFirstElementInViewport(doc: Document | undefined, selector: string) {
    const win = doc?.defaultView;
    if (!doc || !win) return null;
    return Array.from(doc?.querySelectorAll<HTMLElement>(selector + VISIBLE_CHILD_SELECTOR))
        .find((elem) => {
            const rect = elem.getBoundingClientRect();
            return rect.top >= 0 && rect.top < win.innerHeight;
        });
}

function getFocusableAncestors(elem: HTMLElement | null) {
    let currentElem = elem;
    const focusableAncestors = [];
    while(currentElem) {
        const closestFocusable = currentElem.closest<HTMLElement>(`${SEL_FOCUS_FRAME}, [tabindex="1"]`);
        if (!closestFocusable) break;
        focusableAncestors.push(closestFocusable);
        currentElem = closestFocusable.parentElement
    }
    return focusableAncestors;
}

// Interaction with NavigationEffector
function isNavTransition() {
    return Boolean(history.state?.navTransition);
}

export { FocusAnnouncerElement, PathContext, FocusRestoreCandidateCtx }