import { createElement as $, useMemo, useRef, useContext, ReactNode } from "react";
import { NewPopupElement } from "./popup-element";
import { Patch, usePatchSync } from "../exchange/patch-sync";
import { NoCaptionContext } from "../../main/vdom-hooks";
import { PopupContext, PopupStack } from "./popup-context";

interface PopupManager {
    identity: Object,
    openedPopups: PopupStack,
    children: ReactNode
}

function PopupManager({identity, openedPopups=[], children}: PopupManager) {
    const { currentState, sendFinalChange } = 
        usePatchSync(identity, 'receiver', openedPopups, false, s => s, changeToPatch, patchToChange, applyChange);

    // Popup drawer element ref for Portal
    const popupDrawerRef = useRef<HTMLElement | undefined>();
    const popupDrawer = $(NoCaptionContext.Provider, {value: false}, $('div', {ref: popupDrawerRef}));
    
    const togglePopup = (popupKey: string) => sendFinalChange({
        tp: currentState.includes(popupKey) ? 'close' : 'open',
        popupKey: popupKey
    });

    const value: PopupContext = useMemo(() => {
        return { currentState, togglePopup, popupDrawer: popupDrawerRef.current };
    }, [JSON.stringify(currentState)]);

    return $(PopupContext.Provider, { value }, children, popupDrawer);
}


// Server sync functions
interface PopupChange {
    tp: 'open' | 'close',
    popupKey: string
}

function changeToPatch(ch: PopupChange): Patch {
    return {
        value: ch.tp,
        headers: { 'x-r-popupKey': ch.popupKey }
    }
};

function patchToChange(p: Patch): PopupChange {
    return {
        tp: p.value as 'open' | 'close',
        popupKey: p.headers!['x-r-popupKey']
    }
};

const applyChange = (prevState: PopupStack, ch: PopupChange): PopupStack => {
    return ch.tp === 'open' 
        ? prevState.concat(ch.popupKey) 
        : prevState.filter(key => key === ch.popupKey);
}


const usePopupState = (popupKey: string) => {
    const { currentState, togglePopup } = useContext(PopupContext);
    const isOpened = currentState.includes(popupKey);
    const toggle = (on: boolean) => {
        if (on && !isOpened || !on && isOpened) togglePopup(popupKey);
    };
    return { isOpened, toggle };
}

export { PopupManager, usePopupState }
export const popupComponents = { PopupManager, NewPopupElement };