import React, { ReactNode, createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopupPos } from '../../main/popup';
import { SEL_FOCUSABLE_ATTR } from '../focus-module-interface';
import { PopupContext } from './popup-context';
import { usePopupState } from './popup-manager';
import { useAddEventListener } from '../custom-hooks';

interface PopupElement {
    key?: string,
    popupKey: string,
    children?: ReactNode
}

function NewPopupElement({ popupKey, children }: PopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);
    const { isOpened, toggle } = usePopupState(popupKey);

    const parent = useRef<HTMLElement | null>(null);
    const setPopupParent = useCallback((elem: HTMLElement | null) => {
        if (!elem) return;
        parent.current = elem.closest<HTMLElement>(SEL_FOCUSABLE_ATTR);
    }, []);

    function closeOnBlur(e: FocusEvent) {
        if (!(e.relatedTarget instanceof Node)) return;
        for (const elem of [popupElement, parent.current]) {
            if (elem?.contains(e.relatedTarget)) return;
        }
        toggle(false);
	};
    useAddEventListener(popupElement?.ownerDocument, 'focusout', closeOnBlur);

    const { openedPopups, sendFinalChange } = useContext(PopupContext);
    const popupAncestorKey = useContext(PopupAncestorKeyContext);
    useLayoutEffect(
        function closeRivalPopupsAfterOpening() {
            if (isOpened && openedPopups.length > 1) {
                const popupAncestorIndex = openedPopups.indexOf(popupAncestorKey);
                sendFinalChange([...openedPopups.slice(0, popupAncestorIndex), popupKey]);
            }
        },
        [isOpened]
    );

    useLayoutEffect(() => {
        return function preventFocusLossAfterClosing() {
            if (popupElement?.contains(popupElement?.ownerDocument.activeElement)) parent.current?.focus();
        }
    }, []);

    const portalContainer = parent.current?.ownerDocument.body;

    const [popupStyle] = usePopupPos(popupElement, false, parent.current);

    const popup = (
        <div ref={setPopupElement} className='popupEl' style={popupStyle} onClick={(e)=>e.stopPropagation()} tabIndex={-1} >
            {children}
        </div>
    );

    return (
        <PopupAncestorKeyContext.Provider value={popupKey} >
            {isOpened && portalContainer && createPortal(popup, portalContainer)}
            <span ref={setPopupParent} style={{display: 'none'}}></span>
        </PopupAncestorKeyContext.Provider>
    );
}

const PopupAncestorKeyContext = createContext('');
PopupAncestorKeyContext.displayName = 'PopupAncestorKeyContext';

export { NewPopupElement }