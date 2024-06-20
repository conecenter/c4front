import React, { useRef, ReactNode, useEffect, useState, useLayoutEffect } from 'react';
import { PathContext } from './focus-control';
import { Patch } from './exchange/patch-sync';
import { useAddEventListener } from './custom-hooks';
import { VISIBLE_CHILD_SELECTOR } from './css-selectors';

interface FocusAnnouncerElement {
    path: string,
    value: string,
    onChange: (change: FocusChange) => void,
    children: ReactNode
}

interface FocusChange {
    target: Patch
}

function FocusAnnouncerElement({ path, value, onChange, children }: FocusAnnouncerElement) {
    const [doc, setDoc] = useState<Document | undefined>(undefined);

    const isMounted = useRef(true);
    useLayoutEffect(() => {
            isMounted.current = true;
            return () => { isMounted.current = false; }
    });

    const isFocusedView = useRef(false);
    useEffect(() => { isFocusedView.current = isRootBranch(doc) }, [doc]);

    function onFocus(e: FocusEvent) {
        isFocusedView.current = true;
        const newPath = (e.target as Element).closest<HTMLElement>('[data-path]')?.dataset.path;
        if (newPath) sendChange(newPath);
    }
    const sendChange = (path: string) => {
        if (path !== value) onChange({ target: { headers: { "x-r-action": "change" }, value: path } });
    }
    useAddEventListener(doc, 'focusin', onFocus, true);

    function onBlur(e: FocusEvent) {
        isFocusedView.current = false;
        if (e.relatedTarget === null) preventFocusLoss(e.target as HTMLElement | null);
    }
    function preventFocusLoss(target: HTMLElement | null) {
        const focusableAncestors = getFocusableAncestors(target);
        setTimeout(() => {  // without setTimeout target still exists in doc
            // hasNoFocusedElement gives other routines (e.g. popup) chance to do its own focus loss prevention
            const isFocusLost = doc && !doc.contains(target) && hasNoFocusedElement(doc);
            if (isFocusLost && isMounted.current) {
                const aliveFocusableAncestor = focusableAncestors.find((elem) => doc?.contains(elem) && elem.dataset.path !== path);
                (aliveFocusableAncestor || findAutofocusCandidate(doc))?.focus();
            }
        });
    }
    useAddEventListener(doc, 'focusout', onBlur);

    useEffect(
        function alignFocusWithFocusFrame() {
            if (!isFocusedView.current) return;
            if (!value) findAutofocusCandidate(doc)?.focus();
            const activeElem = doc?.activeElement;
            const activeElemPath = activeElem?.closest<HTMLElement>('[data-path]')?.dataset.path;
            if (activeElemPath !== value) {
                const focusFrameElem = doc?.querySelector<HTMLElement>(`*[data-path='${value}']${VISIBLE_CHILD_SELECTOR}`);
                focusFrameElem?.focus();
            }
        }
    );

    return (
        <div
            ref={elem => setDoc(elem?.ownerDocument)}
            style={{ minHeight: "100vh" }}
            tabIndex={-1}
            data-path={path}
        >
            <PathContext.Provider value={value}>
                {children}
            </PathContext.Provider>
        </div>
    );
}

function isRootBranch(doc: Document | undefined) {
    return doc ? doc.defaultView === doc.defaultView?.parent : false;
}

function findAutofocusCandidate(doc: Document | undefined) {
    return doc?.querySelector<HTMLElement>('input');
}

function hasNoFocusedElement(doc: Document) {
    return !doc.activeElement || doc.activeElement.tagName === 'BODY';
}

function getFocusableAncestors(elem: HTMLElement | null) {
    let currentElem = elem;
    const focusableAncestors = [];
    while(currentElem) {
        const closestFocusable = currentElem.closest<HTMLElement>('[data-path], [tabindex]');
        if (!closestFocusable) break;
        focusableAncestors.push(closestFocusable);
        currentElem = closestFocusable.parentElement
    }
    return focusableAncestors;
}

export { FocusAnnouncerElement }