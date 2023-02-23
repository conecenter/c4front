import React, { ReactNode, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopupPos } from '../../main/popup';
import { NoCaptionContext } from '../../main/vdom-hooks';
import { useAddEventListener } from '../custom-hooks';
import { elementHasFocus } from '../dom-utils';
import { PopupContext, usePopupState } from './popup-manager';

interface PopupElement {
    key?: string,
    children?: ReactNode
}

function NewPopupElement({ key = ':popup', children }: PopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);
    
    const popupParent = useRef<HTMLElement | null>(null);
    const setPopupParent = useCallback((el: HTMLElement | null) => popupParent.current = el && el.parentElement, []);

    // Popup state
    const [isOpened, toggle, popupDrawer] = useContext(PopupContext);

    // Popup positioning
    const [popupStyle] = usePopupPos(popupElement, false, popupParent.current);

    // Prevent focus loss after closing
    useLayoutEffect(() => {
        return () => {
            if (elementHasFocus(popupDrawer)) focusFocusableAncestor(popupParent.current);
        }
    }, []);

    const popup = (
        <div ref={setPopupElement} className='popupEl' style={popupStyle} tabIndex={-1} >
            {children}
        </div>
    );

    return (
        <NoCaptionContext.Provider value={false} >
            {popupDrawer ? createPortal(popup, popupDrawer) : null}
            <span ref={setPopupParent} style={{display: 'none'}}></span>
        </NoCaptionContext.Provider>
    );
}

function elementIsInsideElements(target: EventTarget | null, elems: (HTMLElement | null)[]) {
    if (!(target instanceof Node)) return;
    for (const elem of elems) {
        if (elem?.contains(target)) return true;
    }
}

function focusFocusableAncestor(elem?: HTMLElement | null) {
    const focusableAncestor = elem?.closest<HTMLElement>('[data-path]');
    focusableAncestor?.focus();
}

export { NewPopupElement }