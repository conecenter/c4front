import React, { useRef, ReactNode, useEffect, useState, useCallback, createContext, useReducer, useMemo } from 'react';
import { PatchSyncTransformers, usePatchSync } from './exchange/patch-sync';
import { useAddEventListener, useIsMounted } from './custom-hooks';
import { SEL_FOCUS_FRAME, VISIBLE_CHILD_SELECTOR, FOCUS_BLOCKER_CLASS } from './css-selectors';
import { identityAt } from '../main/vdom-util';

/*
    Focus change cases:
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

    Global autoFocusFlag because focus events fire synchronously.
    We keep the flag true for the entire event-loop turn so every focus event caused by this programmatic focus
    (including chained or delegated ones) is treated as local restoration, not user intent.
*/

let autoFocusFlag = false;

function focusAuto(elem?: HTMLElement | null) {
    if (!elem) return;
    autoFocusFlag = true;
    elem.focus();
    queueMicrotask(() => { autoFocusFlag = false });
}

const getFocusFramePath = (elem?: Element | null) => elem?.closest<HTMLElement>(SEL_FOCUS_FRAME)?.dataset.path;

const PathContext = createContext("path");
PathContext.displayName = "PathContext";

const FocusRestoreCandidateCtx = createContext<(node: HTMLElement | null) => void>(() => undefined);
FocusRestoreCandidateCtx.displayName = "FocusRestoreCandidateCtx";

const receiverIdOf = identityAt('receiver');

const patchSyncTransformers: PatchSyncTransformers<string, string, string> = {
    serverToState: s => s,
    changeToPatch: (ch) => ({ headers: {"x-r-action": "change"}, value: ch }),
    patchToChange: (p) => p.value,
    applyChange: (_prev, ch) => ch
};

interface FocusAnnouncerElement {
    identity: object,
    path: string,
    value: string,
    children: ReactNode
}

function FocusAnnouncerElement({ identity, path: thisPath, value: serverValue, children }: FocusAnnouncerElement) {
    const [doc, setDoc] = useState<Document | undefined>(undefined);
    const setupDoc = useCallback((elem: HTMLDivElement) => setDoc(elem?.ownerDocument), []);

    const { currentState, sendFinalChange } =
        usePatchSync(receiverIdOf(identity), serverValue, false, patchSyncTransformers);

    const { localFocusRef, setLocalFocus } = useLocalFocus(currentState);

    const value = localFocusRef.current ?? currentState;

    const sendChange = (path: string) => {
        if (path !== value) {
            const setFocus = autoFocusFlag ? setLocalFocus : sendFinalChange;
            setFocus(path);
        }
    }

    const focusBackupElement = useCallback(() => {
        const backupElement = findAutofocusCandidate(doc);
        if (backupElement) focusAuto(backupElement);
        else setLocalFocus('');
    }, [doc, setLocalFocus]);

    useReportPathOnFocus(doc, thisPath, sendChange, localFocusRef);

    const registerFocusCandidate = usePreventFocusLoss(doc, value, focusBackupElement);

    useAlignFocusWithServerValue(doc, value, focusBackupElement);

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

function useLocalFocus(currentState: string) {
    const localFocusRef = useRef<string | null>(null);
    const [, rerender] = useReducer(x => x + 1, 0);

    const setLocalFocus = useCallback((path: string | null) => {
        if (localFocusRef.current !== path) {
            localFocusRef.current = path;
            rerender();
        }
    }, []);
    useMemo(() => { localFocusRef.current = null }, [currentState]);
    return { localFocusRef, setLocalFocus };
}

function usePreventFocusLoss(
    doc: Document | undefined,
    focusPath: string,
    focusBackupElement: () => void
) {
    const isMountedRef = useIsMounted();
    const focusCandidateRef = useRef<HTMLElement | null>(null);

    useMemo(() => { focusCandidateRef.current = null }, [focusPath]);

    const registerFocusCandidate = useCallback((node: HTMLElement | null) => {
        focusCandidateRef.current = node;
    }, []);

    function onBlur(e: FocusEvent) {
        if (e.relatedTarget !== null || isNavTransition()) return;
        const target = e.target as HTMLElement | null;
        const focusableAncestors = getFocusableAncestors(target);
        queueMicrotask(() => {  // microtask to let react finish commit and remove DOM node
            if (shouldRestoreFocus(doc, target, focusPath) && isMountedRef.current) {
                const focusTo = focusCandidateRef.current || focusableAncestors.find((elem) => elem.isConnected);
                if (focusTo) focusAuto(focusTo);
                else focusBackupElement();
            }
        });
    }
    useAddEventListener(doc, 'focusout', onBlur);

    return registerFocusCandidate;
}

function shouldRestoreFocus(doc: Document | undefined, target: HTMLElement | null, focusPath: string) {
    const hasNoFocusedElement = () => doc?.activeElement?.tagName === 'BODY';
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
    sendChange: (path: string) => void,
    localFocusRef: React.MutableRefObject<string | null>
) {
    function onFocus(e: FocusEvent) {
        const newPath = getFocusFramePath(e.target as Element) || thisPath;
        localFocusRef.current = null;
        if (newPath) sendChange(newPath);
    }
    useAddEventListener(doc, 'focusin', onFocus, true);
}

function useAlignFocusWithServerValue(
    doc: Document | undefined,
    value: string,
    focusBackupElement: () => void
) {
    const isFocusedViewRef = useIsFocusedView(doc);
    // effect should have no deps due to gradual render of most views
    useEffect(() => {
        if (!isFocusedViewRef.current || isNavTransition()) return;
        if (!value) return focusBackupElement();
        const activeElemPath = getFocusFramePath(doc?.activeElement);
        if (activeElemPath !== value) {
            const elemToFocus = doc?.querySelector<HTMLElement>(`[data-path='${value}']${VISIBLE_CHILD_SELECTOR}`);
            if (elemToFocus) elemToFocus.focus();
            else focusBackupElement();
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

export { FocusAnnouncerElement, PathContext, FocusRestoreCandidateCtx, focusAuto }