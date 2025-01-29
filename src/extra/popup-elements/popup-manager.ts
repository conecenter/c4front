import { createElement as $, useMemo, useContext, ReactNode, useState } from "react";
import { PopupElement } from "./popup-element";
import { Patch, usePatchSync } from "../exchange/patch-sync";
import { PopupStateContext, PopupDrawerContext, PopupStack } from "./popup-contexts";
import { identityAt } from "../../main/vdom-util";
import { Identity } from "../utils";

// Server sync functions
const receiverIdOf = identityAt('receiver');
const serverToState = (s: PopupStack) => s;
const changeToPatch = (ch: PopupStack): Patch => ({ value: ch.join('|') });
const patchToChange = (p: Patch): PopupStack => p.value.split('|').filter(Boolean);
const applyChange = (_prevState: PopupStack, ch: PopupStack) => ch;
const patchSyncTransformers = { serverToState, changeToPatch, patchToChange, applyChange };

interface PopupManager {
    identity: Identity,
    openedPopups: PopupStack,
    children: ReactNode
}

function PopupManager({identity, openedPopups=[], children}: PopupManager) {
    const { currentState, sendFinalChange } =
        usePatchSync(receiverIdOf(identity), openedPopups, false, patchSyncTransformers);

    const [popupDrawer, setPopupDrawer] = useState<HTMLElement | null>(null);

    const popupStateContextValue = useMemo<PopupStateContext>(() => (
        { openedPopups: currentState, sendFinalChange }
    ), [JSON.stringify(currentState)]);

    return $(PopupStateContext.Provider, { value: popupStateContextValue },
        $(PopupDrawerContext.Provider, { value: popupDrawer },
            children,
            $('div', { ref: setPopupDrawer, className: 'popupDrawer' }) // className used by testers
        )
    );
}


const usePopupState = (popupKey: string | null) => {
    const { openedPopups, sendFinalChange } = useContext(PopupStateContext);
    const isOpened = !!popupKey && openedPopups.includes(popupKey);
    const toggle = (on: boolean) => {
        if (!popupKey) return;
        if (on && !isOpened) sendFinalChange([...openedPopups, popupKey]);
        else if (!on && isOpened) sendFinalChange(openedPopups.slice(0, openedPopups.indexOf(popupKey)));
    };
    return { isOpened, toggle };
}

export { PopupManager, usePopupState }
export const popupComponents = { PopupManager, PopupElement };