import React, { ReactNode, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopupPos } from '../../main/popup';
import { NoCaptionContext } from '../../main/vdom-hooks';
import { elementHasFocus } from '../dom-utils';
import { PopupContext } from './popup-manager';

interface PopupElement {
    key?: string,
    children?: ReactNode
}

function PopupElement({ key = ':popup', children }: PopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);

    const { popupDrawer } = useContext(PopupContext);

    // Popup positioning
    const popupParent = useRef<HTMLElement | null>(null);
    const setPopupParent = useCallback((el: HTMLElement | null) => popupParent.current = el && el.parentElement, []);

    const [popupStyle] = usePopupPos(popupElement, false, popupParent.current);

    // Prevent focus loss after closing
    useLayoutEffect(() => {
        return () => {
            if (elementHasFocus(popupElement)) popupParent.current?.focus();
        }
    }, []);

    const popup = (
        <div ref={setPopupElement} className='popupEl' style={popupStyle} tabIndex={-1} >
            {children}
        </div>
    );

    return (
        <NoCaptionContext.Provider value={false} >
            {popupDrawer && createPortal(popup, popupDrawer)}
            <span ref={setPopupParent} style={{display: 'none'}}></span>
        </NoCaptionContext.Provider>
    );
}

export { PopupElement }