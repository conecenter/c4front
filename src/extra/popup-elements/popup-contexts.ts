import { createContext } from "react";

type PopupStack = string[];

interface PopupStateContext {
    openedPopups: PopupStack,
    sendFinalChange: (change: PopupStack) => void
}

const defaultPopupContext: PopupStateContext = {
    openedPopups: [],
    sendFinalChange: () => undefined
};

const PopupStateContext = createContext(defaultPopupContext);
PopupStateContext.displayName = 'PopupStateContext';

// PopupDrawerContext - to extract popup from its stacking context
const PopupDrawerContext = createContext<HTMLElement | null>(null);
PopupDrawerContext.displayName = 'PopupDrawerContext';

const PopupWrapperKeyContext = createContext('');
PopupWrapperKeyContext.displayName = 'PopupWrapperKeyContext';

export type { PopupStack };
export { PopupStateContext, PopupDrawerContext, PopupWrapperKeyContext }