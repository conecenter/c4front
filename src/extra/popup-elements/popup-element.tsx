import React, { ReactNode, createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopupPos } from '../../main/popup';
import { usePath } from '../../main/vdom-hooks';
import { SEL_FOCUSABLE_ATTR } from '../focus-module-interface';
import { PopupContext } from './popup-context';
import { usePopupState } from './popup-manager';
import { useAddEventListener } from '../custom-hooks';
import { isInstanceOfNode } from '../dom-utils';
import { PopupOverlay } from './popup-overlay';

const DEFAULT_IDENTITY = { key: 'popup-element' };

interface PopupElement {
    identity?: object,
    popupKey: string,
    overlay?: boolean,
    children?: ReactNode
}

function PopupElement({ identity = DEFAULT_IDENTITY, popupKey, overlay: overlayProp, children }: PopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);
    const path = usePath(identity);

    const { isOpened, toggle } = usePopupState(popupKey);

    const popupAncestorKey = useContext(PopupAncestorKeyContext);
    const { openedPopups, sendFinalChange, popupDrawer } = useContext(PopupContext);

    const parent = useRef<HTMLElement | null>(null);
    const setPopupParent = useCallback((elem: HTMLElement | null) => {
        parent.current = elem && elem.closest<HTMLElement>(SEL_FOCUSABLE_ATTR);
    }, []);

    function closeOnBlur(e: FocusEvent) {
        if (elementsContainTarget([popupElement, parent.current], e.relatedTarget)) return;
        toggle(false);
	}
    useAddEventListener(popupElement?.ownerDocument, 'focusout', closeOnBlur);

    useLayoutEffect(
        function closeRivalPopupsAfterOpening() {
            if (isOpened && openedPopups.length > 1) {
                const popupAncestorIndex = openedPopups.indexOf(popupAncestorKey);
                sendFinalChange([...openedPopups.slice(0, popupAncestorIndex + 1), popupKey]);
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

    return (
        <PopupAncestorKeyContext.Provider value={popupKey} >
            {isOpened && popupDrawer && createPortal(
                <div
                    ref={setPopupElement}
                    className='popupEl'
                    style={popupStyle}
                    onClick={(e)=>e.stopPropagation()}
                    tabIndex={-1}
                    data-path={path}
                    children={children}
                />,
                popupDrawer
            )}
            <span ref={setPopupParent} style={{display: 'none'}}></span>
            <PopupOverlay popupElement={popupElement} overlayProp={!!overlayProp} />
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