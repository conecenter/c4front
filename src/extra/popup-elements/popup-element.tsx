import React, { ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopupPos } from '../../main/popup';
import { getPath, Identity, PathContext } from '../focus-control';
import { PopupContext } from './popup-manager';

interface PopupElement {
    key: string,
    identity: Identity,
    popupKey: string,
    children?: ReactNode
}

function PopupElement({ identity, popupKey, children }: PopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);

    const { isOpened, togglePopup, popupDrawer } = useContext(PopupContext);
    const focusPath = useContext(PathContext);

    // Popup positioning
    const popupParent = useRef<HTMLElement | null>(null);
    const setPopupParent = useCallback((el: HTMLElement | null) => popupParent.current = el && el.parentElement, []);

    const [popupStyle] = usePopupPos(popupElement, false, popupParent.current);

    // Close popup when parent loses focus
    const parentPath = useMemo(() => getPath(identity.parent), []);
    useEffect(() => {
        if (isOpened(popupKey) && !focusPath?.includes(parentPath)) togglePopup(popupKey);
    }, [focusPath]);

    // Prevent focus loss after closing
    useLayoutEffect(() => {
        return () => {
            if (focusPath?.includes(popupKey)) popupParent.current?.focus();
        }
    }, []);

    const popup = (
        <div ref={setPopupElement} className='popupEl' style={popupStyle} tabIndex={-1} >
            {children}
        </div>
    );

    return (
        <>
            {isOpened(popupKey) && popupDrawer && createPortal(popup, popupDrawer)}
            <span ref={setPopupParent} style={{display: 'none'}}></span>
        </>
    );
}

export { PopupElement }