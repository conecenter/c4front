import { createElement as $, createContext, useMemo, useState, useContext, useCallback } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import { SyncedPopup } from "./synced-popup";
import { NewPopupElement } from "./popup-element";
import { usePath } from "../../main/vdom-hooks";

type PopupContext = [string, Dispatch<SetStateAction<string>>, HTMLElement | undefined] | [];

const PopupContext = createContext<PopupContext>([]);
PopupContext.displayName = "PopupContext";

interface PopupManager {
    children: ReactNode
}

function PopupManager({children}: PopupManager) {
    const [popup, setPopup] = useState<string>('');   // TODO: sync
    const [popupDrawerRef, setPopupDrawerRef] = useState<HTMLElement>();

    const popupDrawer = $('div', {ref: setPopupDrawerRef});

    const value: PopupContext = useMemo(
        () => [popup, setPopup, popupDrawerRef],
        [popup, popupDrawerRef]
    );

    return $(PopupContext.Provider, { value }, children, popupDrawer);
}


type PopupState = [boolean, (on: boolean) => void, HTMLElement | undefined]

const usePopupState = (identity: object): PopupState => {
    const path = usePath(identity);
    const [popup, setPopup, popupDrawer] = useContext(PopupContext);
    const isOpened = useCallback((p?: string)=> p === path, [path]);
    const setOpened = useCallback((on: boolean) => setPopup?.(on ? path : ''), [path]);
    return [isOpened(popup), setOpened, popupDrawer];
}


export const popupComponents = { PopupManager, NewPopupElement, SyncedPopup };
export { PopupManager, usePopupState, PopupContext }