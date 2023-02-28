import { createContext } from "react";

type PopupStack = string[];

interface PopupContext {
    currentState: PopupStack,
    togglePopup: (popupKey: string) => void,
    popupDrawer?: HTMLElement
};

const defaultPopupContext: PopupContext = {
    currentState: [],
    togglePopup: () => undefined
};

const PopupContext = createContext(defaultPopupContext);

export type { PopupStack };
export { PopupContext }