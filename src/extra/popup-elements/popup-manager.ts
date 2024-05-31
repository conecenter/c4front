import { createElement as $, useMemo, useContext, ReactNode, useState } from "react";
import { PopupElement } from "./popup-element";
import { Patch, usePatchSync } from "../exchange/patch-sync";
import { PopupStateContext, PopupDrawerContext, PopupStack } from "./popup-context";

// Server sync functions
const changeToPatch = (ch: PopupStack): Patch => ({ value: ch.join('|') });
const patchToChange = (p: Patch): PopupStack => p.value.split('|').filter(Boolean);
const applyChange = (_prevState: PopupStack, ch: PopupStack) => ch;


interface PopupManager {
    identity: object,
    openedPopups: PopupStack,
    children: ReactNode
}

function PopupManager({identity, openedPopups=[], children}: PopupManager) {
    const { currentState, sendFinalChange } =
        usePatchSync(identity, 'receiver', openedPopups, false, s => s, changeToPatch, patchToChange, applyChange);

    const [popupDrawer, setPopupDrawer] = useState<HTMLElement | null>(null);

    const popupStateContextValue = useMemo<PopupStateContext>(() => (
        { openedPopups: currentState, sendFinalChange }
    ), [JSON.stringify(currentState)]);

    return $(PopupStateContext.Provider, { value: popupStateContextValue },
        $(PopupDrawerContext.Provider, { value: popupDrawer },
            children,
            $('div', {ref: setPopupDrawer})
        )
    );
}


const usePopupState = (popupKey: string) => {
    const { openedPopups, sendFinalChange } = useContext(PopupStateContext);
    const isOpened = openedPopups.includes(popupKey);
    const toggle = (on: boolean) => {
        if (on && !isOpened) sendFinalChange([...openedPopups, popupKey]);
        else if (!on && isOpened) sendFinalChange(openedPopups.slice(0, openedPopups.indexOf(popupKey)));
    };
    return { isOpened, toggle };
}

export { PopupManager, usePopupState }
export const popupComponents = { PopupManager, PopupElement };