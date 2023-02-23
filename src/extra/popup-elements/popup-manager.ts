import { createElement as $, createContext, useMemo, useRef, useContext, useEffect, ReactNode } from "react";
import { PathContext } from "../focus-control";
import { PopupElement } from "./popup-element";
import { usePatchSync } from "../exchange/patch-sync";

interface PopupContext {
    isOpened: (path: string) => boolean,
    togglePopup: (path: string) => void,
    popupDrawer?: HTMLElement
};

const defaultPopupContext: PopupContext = {
    isOpened: () => false,
    togglePopup: () => undefined
};

const PopupContext = createContext(defaultPopupContext);
const NoContext = createContext({});

interface PopupManager {
    identity: Object,
    popupPath: string,
    children: ReactNode
}

function PopupManager({identity, popupPath = '', children}: PopupManager) {
    const { currentState: popup, sendFinalChange: setPopup } =
        usePatchSync(identity, 'receiver', popupPath, false, s => s, (ch: string) => ({value: ch}), p => p.value, (_, ch) => ch);

    // Popup drawer element ref for Portal
    const popupDrawerRef = useRef<HTMLElement | undefined>();
    const popupDrawer = $('div', {ref: popupDrawerRef});

    // Popups closing on focus changes
    const focusPath = useContext(PathContext);
    useEffect(() => {
        console.log({focusPath, popup})
        if (popup && !focusPath.includes(popup)) {
            // TODO: find closest ':popup' key from the end of focusPath and make it new popup,
            setPopup('');
        }
    }, [popup, focusPath]);

    const isOpened = (path: string) => popup.includes(path);
    // TODO: find closest ':popup' key from the end of popup and make it new popup
    const togglePopup = (path: string) => setPopup(isOpened(path) ? '' : path);

    const value: PopupContext = useMemo(() => {
        return { isOpened, togglePopup, popupDrawer: popupDrawerRef.current };
    }, [popup]);

    return $(PopupContext.Provider, { value }, children, popupDrawer);
}

export { PopupManager, PopupContext, NoContext }
export const popupComponents = { PopupManager, PopupElement };