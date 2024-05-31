import React, { ReactNode, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PopupStateContext, PopupDrawerContext, PopupWrapperKeyContext } from './popup-context';
import { usePopupPos } from '../../main/popup';
import { NoCaptionContext } from '../../main/vdom-hooks';
import { SEL_FOCUSABLE_ATTR } from '../focus-module-interface';
import { usePopupState } from './popup-manager';
import { useAddEventListener } from '../custom-hooks';
import { isInstanceOfNode } from '../dom-utils';
import { PopupOverlay } from './popup-overlay';
import { NoFocusContext } from '../labeled-element';

interface PopupElement {
    popupKey: string,
    forceOverlay?: boolean,
    children?: ReactNode
}

function PopupElement({ popupKey, forceOverlay, children }: PopupElement) {
    const { openedPopups, sendFinalChange } = useContext(PopupStateContext);
    const popupAncestorKey = useContext(PopupWrapperKeyContext);
    const popupDrawer = useContext(PopupDrawerContext);

    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);

    const { isOpened, toggle } = usePopupState(popupKey);

    const parent = useRef<HTMLElement | null>(null);
    const setPopupParent = useCallback((elem: HTMLElement | null) => {
        parent.current = elem && elem.parentElement;
    }, []);

    const [popupStyle] = usePopupPos(popupElement, false, parent.current);

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
        }, [isOpened]
    );

    useLayoutEffect(
        function preventFocusLossOnClosing() {
            return () => {
                if (isOpened && elementHasFocus(popupElement)) findFocusableAncestor(parent.current)?.focus();
            }
        }, [isOpened]
    );

    const popup = (
        <>
            <div ref={setPopupElement}
                className='popupEl'
                style={popupStyle}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
                data-path={`/popup-${popupKey}`}  // needed for FocusAnnouncer's focus loss prevention
                children={children} />
            <PopupOverlay popupElement={popupElement} forceOverlay={!!forceOverlay} />
        </>
    );

    return (
        <PopupWrapperKeyContext.Provider value={popupKey} >
            <PopupDrawerContext.Provider value={popupElement} >
                <NoCaptionContext.Provider value={false} >
                    <NoFocusContext.Provider value={false} >
                        {isOpened && popupDrawer && createPortal(popup, popupDrawer)}
                        <span ref={setPopupParent} style={{display: 'none'}}></span>
                    </NoFocusContext.Provider>
                </NoCaptionContext.Provider>
            </PopupDrawerContext.Provider>
        </PopupWrapperKeyContext.Provider>
    );
}

function elementsContainTarget(elems: (HTMLElement | null)[], target: EventTarget | null) {
    if (!isInstanceOfNode(target)) return;
    for (const elem of elems) {
        if (elem?.contains(target)) return true;
    }
}

function elementHasFocus(element?: HTMLElement | null) {
	if (!element) return false;
	const activeElement = element.ownerDocument.activeElement;
	return element.contains(activeElement);
}

function findFocusableAncestor(elem?: HTMLElement | null) {
    return elem?.closest<HTMLElement>(SEL_FOCUSABLE_ATTR) || null;
}

export { PopupElement }