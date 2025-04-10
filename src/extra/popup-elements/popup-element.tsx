import React, { ReactNode, useCallback, useContext, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { PopupStateContext, PopupDrawerContext, PopupWrapperKeyContext } from './popup-contexts';
import { usePopupPos } from '../../main/popup';
import { NoCaptionContext } from '../../main/vdom-hooks';
import { usePopupState } from './popup-manager';
import { useAddEventListener } from '../custom-hooks';
import { isInstanceOfNode } from '../dom-utils';
import { PopupOverlay } from './popup-overlay';
import { SEL_FOCUS_FRAME, VISIBLE_CHILD_SELECTOR } from '../css-selectors';
import { useFocusControl } from '../focus-control';

interface PopupElement {
    popupKey: string,
    className?: string,
    forceOverlay?: boolean,
    lrMode?: boolean,
    children?: ReactNode
}

function PopupElement({ popupKey, className, forceOverlay, lrMode, children }: PopupElement) {
    const { openedPopups, sendFinalChange } = useContext(PopupStateContext);
    const popupAncestorKey = useContext(PopupWrapperKeyContext);
    const popupDrawer = useContext(PopupDrawerContext);

    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);

    const { isOpened, toggle } = usePopupState(popupKey);

    const { focusClass, focusHtml } = useFocusControl(`/popup-${popupKey}`);

    const [parent, setParent] = useState<HTMLElement | null>(null);
    const setPopupParent = useCallback((elem: HTMLElement | null) => setParent(elem && elem.parentElement), []);

    // menu & filters have multiple copies - hidden & visible - of some elements
    const isVisible = parent?.matches(VISIBLE_CHILD_SELECTOR);

    const [popupStyle] = usePopupPos(popupElement, lrMode, parent);

    function closeOnBlur(e: FocusEvent) {
        if (!e.relatedTarget || elementsContainTarget([popupElement, parent], e.relatedTarget)) return;
        toggle(false);
	}
    useAddEventListener(popupElement?.ownerDocument, 'focusout', closeOnBlur);

    useLayoutEffect(
        function closeRivalPopupsAfterOpening() {
            if (popupElement && openedPopups.length > 1) {
                const popupAncestorIndex = openedPopups.indexOf(popupAncestorKey);
                sendFinalChange([...openedPopups.slice(0, popupAncestorIndex + 1), popupKey]);
            }
        }, [popupElement]
    );

    useLayoutEffect(
        function preventFocusLossOnClosing() {
            return () => {
                if (popupElement && elementHasFocus(popupElement)) {
                    // run focus() after React operations finished to avoid triggering events/effects with stale state
                    setTimeout(() => findFocusableAncestor(parent)?.focus());
                }
            }
        }, [popupElement]
    );

    const popup = (
        <>
            <div ref={setPopupElement}
                className={clsx('popupEl', focusClass, className)}
                style={popupStyle}
                onClick={(e) => e.stopPropagation()}
                {...focusHtml}
                tabIndex={-1}
                children={children} />
            <PopupOverlay popupElement={popupElement} forceOverlay={!!forceOverlay} />
        </>
    );

    return (
        <PopupWrapperKeyContext.Provider value={popupKey} >
            <PopupDrawerContext.Provider value={popupElement} >
                <NoCaptionContext.Provider value={false} >
                    {isOpened && isVisible && popupDrawer && createPortal(popup, popupDrawer)}
                    <span ref={setPopupParent} style={{display: 'none'}}></span>
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
    return elem?.closest<HTMLElement>(SEL_FOCUS_FRAME) || null;
}

export { PopupElement }