import React, { useRef, ReactNode, useEffect, useState } from 'react';
import { PathContext } from './focus-control';
import { Patch } from './exchange/patch-sync';
import { VISIBLE_CHILD_SEL } from './main-menu/main-menu-bar';
import { useAddEventListener } from './custom-hooks';

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

    const isFocusedView = useRef(false);
    useEffect(() => { isFocusedView.current = isRootBranch(doc) }, [doc]);

    const findAutofocusCandidate = () => doc?.querySelector(`input`);

    const sendChange = (path: string) => {
        if (path !== value) onChange({ target: { headers: { "x-r-action": "change" }, value: path } });
    }

    function onFocus(e: FocusEvent) {
        isFocusedView.current = true;
        const newPath = (e.target as Element).closest<HTMLElement>('[data-path]')?.dataset.path;
        if (newPath) sendChange(newPath);
    }
    useAddEventListener(doc, 'focusin', onFocus, true);

    function onBlur(event: FocusEvent) {
        isFocusedView.current = false;
        const e = event;
        setTimeout( // without setTimeout e.target still exists in doc
            function preventFocusLoss() {
                const isFocusLost = e.relatedTarget === null && !doc?.contains(e.target as Node);
                if (isFocusLost) findAutofocusCandidate()?.focus();
            }
        );
    }
    useAddEventListener(doc, 'focusout', onBlur);

    useEffect(
        function correctFocusPosition() {
            if (!isFocusedView.current) return;
            if (!value) findAutofocusCandidate()?.focus();
            else alignFocusWithFocusFrame();
        }
    );

    function alignFocusWithFocusFrame() {
        const activeElem = doc?.activeElement;
        const activeElemPath = activeElem?.closest<HTMLElement>('[data-path]')?.dataset.path;
        if (activeElemPath !== value) {
            const focusFrameElem = doc?.querySelector<HTMLElement>(`*[data-path='${value}']${VISIBLE_CHILD_SEL}`);
            (focusFrameElem || findAutofocusCandidate())?.focus();
        }
    }

    return  (
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

export { FocusAnnouncerElement }