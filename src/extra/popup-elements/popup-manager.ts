import { createElement as $, useMemo, useContext, ReactNode, useState } from "react";
import { PopupElement } from "./popup-element";
import { Patch, usePatchSync } from "../exchange/patch-sync";
import { PopupContext, PopupStack } from "./popup-context";

// Server sync functions
const changeToPatch = (ch: PopupStack): Patch => ({ value: ch.join('|') });
const patchToChange = (p: Patch): PopupStack => p.value.split('|');
const applyChange = (_prevState: PopupStack, ch: PopupStack) => ch;


interface PopupManager {
    identity: Object,
    openedPopups: PopupStack,
    children: ReactNode
}

function PopupManager({identity, openedPopups=[], children}: PopupManager) {
    const { currentState, sendFinalChange } =
        usePatchSync(identity, 'receiver', openedPopups, false, s => s, changeToPatch, patchToChange, applyChange);

    const [popupDrawer, setPopupDrawer] = useState<HTMLElement | undefined>();

    const value = useMemo<PopupContext>(() => (
        { openedPopups: currentState, sendFinalChange, popupDrawer }
    ), [JSON.stringify(currentState), popupDrawer]);

    return $(PopupContext.Provider, { value }, children, $('div', {ref: setPopupDrawer}));
}


const usePopupState = (popupKey: string) => {
    const { openedPopups, sendFinalChange } = useContext(PopupContext);
    const isOpened = openedPopups.includes(popupKey);
    const toggle = (on: boolean) => {
        if (on && !isOpened) sendFinalChange([...openedPopups, popupKey]);
        else if (!on && isOpened) sendFinalChange(openedPopups.slice(0, openedPopups.indexOf(popupKey)));
    };
    return { isOpened, toggle };
}

export { PopupManager, usePopupState }
export const popupComponents = { PopupManager, PopupElement };