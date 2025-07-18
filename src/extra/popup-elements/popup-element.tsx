import React, { ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react';
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
import { useCloseSync } from './popup-element-sync';
import { useAreaOverlay } from './use-area-overlay';
import { useFocusTrap } from '../hooks/use-focus-trap';
import { useArrowNavigation } from '../hooks/use-arrow-navigation';

interface PopupElement {
    identity?: object,
    popupKey: string,
    className?: string,
    forceOverlay?: boolean,
    lrMode?: boolean,
    closeReceiver?: boolean,
    children?: ReactNode
}

function PopupElement({ identity, popupKey, className, forceOverlay, lrMode, closeReceiver, children }: PopupElement) {
    const { openedPopups, sendFinalChange } = useContext(PopupStateContext);
    const popupAncestorKey = useContext(PopupWrapperKeyContext);
    const popupDrawer = useContext(PopupDrawerContext);

    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);

    const { isOpened, toggle } = usePopupState(popupKey);

    const { focusClass, focusHtml } = useFocusControl(`/popup-${popupKey}`);

    const [parent, setParent] = useState<HTMLElement | null>(null);
    const setPopupParent = useCallback((elem: HTMLElement | null) => setParent(elem && elem.parentElement), []);

    const { isModal, sendClose } = useCloseSync(identity, closeReceiver);

    const needAreaOverlay = useAreaOverlay(popupElement, forceOverlay || isModal);

    const isModalMode = forceOverlay || isModal || needAreaOverlay;

    // menu & filters have multiple copies - hidden & visible - of some elements
    const isVisible = parent?.matches(VISIBLE_CHILD_SELECTOR);

    const [popupStyle] = usePopupPos(popupElement, lrMode, parent);

    const closePopup = () => sendClose ? sendClose() : toggle(false);
    function closeOnBlur(e: FocusEvent) {
        if (!e.relatedTarget || elementsContainTarget([popupElement, parent], e.relatedTarget)) return;
        closePopup();
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

    useEffect(
        function moveFocusIfModal() {
            if (isModalMode && popupElement && popupStyle.visibility !== "hidden") {
                const activeElem = popupElement.ownerDocument.activeElement;
                if (!popupElement.contains(activeElem)) {
                    const focusTo = popupElement.querySelector<HTMLElement>('input, button');
                    (focusTo || popupElement).focus();
                }
            }
        },
        [isModalMode, popupElement, popupStyle.visibility]
    );

    function closeOnEsc(e: React.KeyboardEvent) {
        if (e.key === "Escape") {
            e.stopPropagation();
            closePopup();
        }
    }

    useFocusTrap(popupElement, !isModalMode);
    useArrowNavigation(popupElement, !isModalMode);

    const popup = (
        <>
            <div ref={setPopupElement}
                className={clsx('popupEl', focusClass, className)}
                style={popupStyle}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={closeOnEsc}
                {...focusHtml}
                tabIndex={-1}
                children={children} />

            <PopupOverlay
                closePopup={closePopup}
                isModalMode={isModalMode}
                transparent={!!closeReceiver} />
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