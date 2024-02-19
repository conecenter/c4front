import React, { ReactNode, useCallback, useRef, useState } from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { usePopupPos } from '../../main/popup';
import { NoCaptionContext, usePath } from '../../main/vdom-hooks';
import { useAddEventListener } from '../custom-hooks';
import { isInstanceOfNode } from '../dom-utils';
import { NoFocusContext } from '../labeled-element';
import { usePopupState } from './popup-manager';

interface PopupElement {
    key?: string,
    identity: object,
    className?: string,
    children?: ReactNode
}

const DEFAULT_IDENTITY = { key: 'popup-element' };

function NewPopupElement({ identity = DEFAULT_IDENTITY, className, children }: PopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);

    const path = usePath(identity);
    
    const popupParent = useRef<HTMLElement | null>(null);
    const setPopupParent = useCallback((el: HTMLElement | null) => popupParent.current = el && el.parentElement, []);

    // Popup state
    const [isOpened, toggle, popupDrawer] = usePopupState(identity);

    // Popup positioning
    const [popupStyle] = usePopupPos(popupElement, false, popupParent.current);
    
    // Popup closing
    const handleBlur = (e: FocusEvent) => {
		if (!e.relatedTarget || elementIsInsideElements(e.relatedTarget, [popupElement, popupParent.current])) return;
        toggle(false);
	};
    const doc = popupElement?.ownerDocument;
    useAddEventListener(doc, 'focusout', handleBlur);

    const popup = (
        <div ref={setPopupElement}
            className={clsx('popupEl', className)}
            style={popupStyle}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            data-path={path}
        >
            {children}
        </div>
    );

    return (
        <NoCaptionContext.Provider value={false} >
            <NoFocusContext.Provider value={false} >
                {isOpened && popupDrawer ? createPortal(popup, popupDrawer) : null}
                <span ref={setPopupParent} style={{display: 'none'}}></span>
            </NoFocusContext.Provider>
        </NoCaptionContext.Provider>
    );
}

function elementIsInsideElements(target: EventTarget | null, elems: (HTMLElement | null)[]) {
    if (!isInstanceOfNode(target)) return;
    for (const elem of elems) {
        if (elem?.contains(target)) return true;
    }
}

export { NewPopupElement }