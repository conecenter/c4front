import React, { ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { None } from '../../main/option';
import { usePopupPos } from '../../main/popup';
import { PathContext } from '../focus-control';
import { SEL_FOCUSABLE_ATTR } from '../focus-module-interface';
import { PopupContext } from './popup-context';
import { usePopupState } from './popup-manager';

interface PopupElement {
    key: string,
    popupKey: string,
    children?: ReactNode
}

interface PopupParent {
    elem: HTMLElement | null,
    path: string
}

function NewPopupElement({ popupKey, children }: PopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);

    const { currentState, togglePopup, popupDrawer } = useContext(PopupContext);
    const focusPath = useContext(PathContext);

    const { isOpened, toggle } = usePopupState(popupKey);

    // Find popup parent and position popup
    const parent = useRef<PopupParent>({ elem: null, path: None });
    const setPopupParent = useCallback((elem: HTMLElement | null) => {
        if (!elem) return;
        const popupParent = elem.closest<HTMLElement>(SEL_FOCUSABLE_ATTR);
        parent.current = {
            elem: popupParent,
            path: popupParent?.dataset?.path || None
        }
    }, []);

    const [popupStyle] = usePopupPos(popupElement, false, parent.current.elem);

    // Close popup when parent loses focus
    useEffect(() => {
        if (!focusPath?.includes(parent.current.path)) toggle(false);
    }, [focusPath]);
    
    useLayoutEffect(() => {
        if (isOpened && currentState.length > 1) {
            const closeSiblings = (key: string) => {
                if (key !== popupKey && !parent.current.path.includes(key)) togglePopup(key);
            }
            currentState.forEach(key => closeSiblings(key));
        }
        return () => {
            // Prevent focus loss after closing
            if (isOpened && focusPath?.includes(popupKey)) parent.current.elem?.focus();
        }
    }, [isOpened]);

    const popup = (
        <div ref={setPopupElement} className='popupEl' style={popupStyle} tabIndex={-1} >
            {children}
        </div>
    );

    return (
        <>
            {isOpened && popupDrawer && createPortal(popup, popupDrawer)}
            <span ref={setPopupParent} style={{display: 'none'}}></span>
        </>
    );
}

export { NewPopupElement }