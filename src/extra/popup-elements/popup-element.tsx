import React, { ReactNode, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopupPos } from '../../main/popup';
import { NoCaptionContext } from '../../main/vdom-hooks';
import { useAddEventListener } from '../custom-hooks';
import { usePopupState } from './popup-manager';

interface PopupElement {
    key?: string,
    identity: Object,
    children?: ReactNode
}

const DEFAULT_IDENTITY = { key: 'popup-element' };

const elementIsInsideElements = (target: EventTarget | null, elems: (HTMLElement | null)[]) => {
    if (!(target instanceof Node)) return;
    for (const elem of elems) {
        if (elem?.contains(target)) return true;
    }
}

function NewPopupElement({ identity = DEFAULT_IDENTITY, children }: PopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);
    
    const popupParent = useRef<HTMLElement | null>(null);
    const setPopupParent = useCallback((el: HTMLElement | null) => popupParent.current = el && el.parentElement, []);

    // Popup state
    const [isOpened, toggle, popupDrawer] = usePopupState(identity);

    // Popup positioning
    const [popupStyle] = usePopupPos(popupElement, false, popupParent.current);
    
    // Popup closing
    const handleBlur = (e: FocusEvent) => {
		if (elementIsInsideElements(e.relatedTarget, [popupElement, popupParent.current])) return;
        toggle(false);
	};
    const doc = popupElement?.ownerDocument;
    useAddEventListener(doc, 'focusout', handleBlur);

    const popup = (
        <div ref={setPopupElement} className='popupEl' style={popupStyle} tabIndex={-1} >
            {children}
        </div>
    );

    return (
        <NoCaptionContext.Provider value={false} >
            {isOpened && popupDrawer ? createPortal(popup, popupDrawer) : null}
            <span ref={setPopupParent} style={{display: 'none'}}></span>
        </NoCaptionContext.Provider>
    );
}

export { NewPopupElement }