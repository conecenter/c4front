import React, { useRef, ReactNode, useEffect, useState } from 'react';
import { Patch } from './exchange/patch-sync';
import { useAddEventListener, useIsMounted } from './custom-hooks';
import { SEL_FOCUS_FRAME, VISIBLE_CHILD_SELECTOR, FOCUS_BLOCKER_CLASS } from './css-selectors';

const PathContext = React.createContext("path");
PathContext.displayName = "PathContext";

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

const getFocusFramePath = (elem?: Element | null) => elem?.closest<HTMLElement>(SEL_FOCUS_FRAME)?.dataset.path;

interface FocusAnnouncerElement {
    path: string,
    value: string,
    onChange: (change: FocusChange) => void,
    children: ReactNode
}

interface FocusChange {
    target: Patch
}

function FocusAnnouncerElement({ path: thisPath, value, onChange, children }: FocusAnnouncerElement) {
    const [doc, setDoc] = useState<Document | undefined>(undefined);

    const sendChange = (path: string) => {
        if (path !== value) onChange({ target: { headers: { "x-r-action": "change" }, value: path } });
    }

    function focusElementOrBackup(elem: HTMLElement | null | undefined) {
        const focusTo = elem || findAutofocusCandidate(doc);
        if (focusTo) focusTo.focus();
        else sendChange('');
    }

    useReportPathOnFocus(doc, thisPath, sendChange);

    usePreventFocusLoss(doc, focusElementOrBackup);

    useAlignFocusWithServerValue(doc, value, focusElementOrBackup);

    const focusFrameStyle = `
        .focusWrapper[data-path='${value}'],
        .focusFrameProvider:has([data-path='${value}']) {
            outline-style: dashed;
        }
    `;

    return (
        <div
            ref={elem => setDoc(elem?.ownerDocument)}
            className='focusAnnouncer'
            tabIndex={-1}
            data-path={thisPath}
        >
            <style>{focusFrameStyle}</style>
            <PathContext.Provider value={value}>
                {children}
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
    focusElementOrBackup: (elem: HTMLElement | null | undefined) => void
) {
    const isMountedRef = useIsMounted();

    function onBlur(e: FocusEvent) {
        if (e.relatedTarget === null) preventFocusLoss(e.target as HTMLElement | null);
    }
    function preventFocusLoss(target: HTMLElement | null) {
        if (isNavTransition()) return;
        const focusableAncestors = getFocusableAncestors(target);
        setTimeout(() => {  // without setTimeout target still exists in doc
            // hasNoFocusedElement gives other routines (e.g. popup) chance to do its own focus loss prevention
            const isFocusLost = doc && !doc.contains(target) && hasNoFocusedElement(doc);
            if (isFocusLost && isMountedRef.current) {
                const aliveFocusableAncestor = focusableAncestors.find((elem) => doc?.contains(elem));
                focusElementOrBackup(aliveFocusableAncestor);
            }
        });
    }
    useAddEventListener(doc, 'focusout', onBlur);
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

function hasNoFocusedElement(doc: Document) {
    return !doc.activeElement || doc.activeElement.tagName === 'BODY';
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

export { FocusAnnouncerElement, PathContext }