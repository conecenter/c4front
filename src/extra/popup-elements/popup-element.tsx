import React, { ReactNode, createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopupPos } from '../../main/popup';
import { SEL_FOCUSABLE_ATTR } from '../focus-module-interface';
import { PopupContext } from './popup-context';
import { usePopupState } from './popup-manager';
import { useAddEventListener } from '../custom-hooks';
import { isInstanceOfNode } from '../dom-utils';

interface PopupElement {
    key?: string,
    popupKey: string,
    children?: ReactNode
}

function PopupElement({ popupKey, children }: PopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);
    const { isOpened, toggle } = usePopupState(popupKey);

    const parent = useRef<HTMLElement | null>(null);
    const setPopupParent = useCallback((elem: HTMLElement | null) => {
        parent.current = elem && elem.closest<HTMLElement>(SEL_FOCUSABLE_ATTR);
    }, []);

    function closeOnBlur(e: FocusEvent) {
        if (elementsContainTarget([popupElement, parent.current], e.relatedTarget)) return;
        toggle(false);
	};
    useAddEventListener(popupElement?.ownerDocument, 'focusout', closeOnBlur);

    const popupAncestorKey = useContext(PopupAncestorKeyContext);
    const { openedPopups, sendFinalChange, popupDrawer } = useContext(PopupContext);
    useLayoutEffect(
        function closeRivalPopupsAfterOpening() {
            if (isOpened && openedPopups.length > 1) {
                const popupAncestorIndex = openedPopups.indexOf(popupAncestorKey);
                sendFinalChange([...openedPopups.slice(0, popupAncestorIndex), popupKey]);
            }
        },
        [isOpened]
    );

    useLayoutEffect(function preventFocusLossAfterClosing() {
        return () => {
            if (popupElement?.contains(popupElement?.ownerDocument.activeElement)) parent.current?.focus();
        }
    }, []);

    const [popupStyle] = usePopupPos(popupElement, false, parent.current);

    const popup = (
        <div ref={setPopupElement} className='popupEl' style={popupStyle} onClick={(e)=>e.stopPropagation()} tabIndex={-1} >
            {children}
        </div>
    );

    return (
        <PopupAncestorKeyContext.Provider value={popupKey} >
            {isOpened && popupDrawer && createPortal(popup, popupDrawer)}
            <span ref={setPopupParent} style={{display: 'none'}}></span>
        </PopupAncestorKeyContext.Provider>
    );
}

function elementsContainTarget(elems: (HTMLElement | null)[], target: EventTarget | null) {
    if (!isInstanceOfNode(target)) return;
    for (const elem of elems) {
        if (elem?.contains(target)) return true;
    }
}

const PopupAncestorKeyContext = createContext('');
PopupAncestorKeyContext.displayName = 'PopupAncestorKeyContext';

export { PopupElement }