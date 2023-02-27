import { createElement as $, createContext, useMemo, useRef, useContext, ReactNode } from "react";
import { PathContext } from "../focus-control";
import { PopupElement } from "./popup-element";
import { Patch, usePatchSync } from "../exchange/patch-sync";
import { NoCaptionContext } from "../../main/vdom-hooks";

// Popup Context
interface PopupContext {
    isOpened: (popupKey: string) => boolean,
    togglePopup: (popupKey: string) => void,
    popupDrawer?: HTMLElement
};

const defaultPopupContext: PopupContext = {
    isOpened: () => false,
    togglePopup: () => undefined
};

const PopupContext = createContext(defaultPopupContext);
const NoContext = createContext({});

// Popup Manager
type PopupStack = string[];

interface PopupManager {
    identity: Object,
    openedPopups: string,
    children: ReactNode
}

// Server sync functions
const changeToPatch = (ch: string): Patch => ({
    value: '',
    headers: { 'x-r-popups': ch }
});

const patchToChange = (p: Patch) => p.headers!['x-r-popups'];


function PopupManager({identity, openedPopups, children}: PopupManager) {
    const { currentState, sendFinalChange } = 
        usePatchSync(identity, 'receiver', openedPopups, false, s => s, changeToPatch, patchToChange, (_, ch) => ch);

    const focusPath = useContext(PathContext);

    // Popup drawer element ref for Portal
    const popupDrawerRef = useRef<HTMLElement | undefined>();
    const popupDrawer = $(NoCaptionContext.Provider, {value: false}, $('div', {ref: popupDrawerRef}));

    const isOpened = (popupKey: string) => currentState.includes(popupKey);
    
    const togglePopup = (popupKey: string) => {
        const popupsArray: PopupStack = JSON.parse(currentState);
        const newPopupsArray = isOpened(popupKey)
            ? popupsArray.filter(key => key === popupKey)
            : [...popupsArray.filter(key => focusPath?.includes(key)), popupKey]
        return sendFinalChange(JSON.stringify(newPopupsArray));
    };

    const value: PopupContext = useMemo(() => {
        return { isOpened, togglePopup, popupDrawer: popupDrawerRef.current };
    }, [currentState, sendFinalChange]);

    return $(PopupContext.Provider, { value }, children, popupDrawer);
}

export { PopupManager, PopupContext, NoContext }
export const popupComponents = { PopupManager, PopupElement };