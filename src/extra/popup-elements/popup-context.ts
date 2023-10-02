import { createContext } from "react";

type PopupStack = string[];

interface PopupContext {
    openedPopups: PopupStack,
    sendFinalChange: (change: PopupStack) => void,
    popupDrawer?: HTMLElement
};

const defaultPopupContext: PopupContext = {
    openedPopups: [],
    sendFinalChange: () => undefined
};

const PopupContext = createContext(defaultPopupContext);
PopupContext.displayName = 'PopupContext';

export type { PopupStack };
export { PopupContext }