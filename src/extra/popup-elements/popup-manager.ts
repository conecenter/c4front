import { createElement as $, createContext, useMemo, useRef, useState, useContext, useCallback } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import { getPath } from "../focus-control";
import { SyncedPopup } from "./synced-popup";
import { NewPopupElement } from "./popup-element";

type PopupContext = [string, Dispatch<SetStateAction<string>>, HTMLElement | undefined] | [];

const PopupContext = createContext<PopupContext>([]);

interface PopupManager {
    children: ReactNode
}

function PopupManager({children}: PopupManager) {
    const [popup, setPopup] = useState<string>('');   // TODO: sync

    const popupDrawerRef = useRef<HTMLElement | undefined>();
    const popupDrawer = $('div', {ref: popupDrawerRef});

    const value: PopupContext = useMemo(() => [popup, setPopup, popupDrawerRef.current], [popup]);

    return $(PopupContext.Provider, { value }, children, popupDrawer);
}


type PopupState = [boolean, (on: boolean) => void, HTMLElement | undefined]

const usePopupState = (identity: Object): PopupState => {
    const path = useMemo(() => getPath(identity), [identity]);
    const [popup, setPopup, popupDrawer] = useContext(PopupContext);
    const isOpened = useCallback((p?: string)=> p === path, [path]);
    const setOpened = useCallback((on: boolean) => setPopup?.(on ? path : ''), [path]);
    return [isOpened(popup), setOpened, popupDrawer];
}


export const popupComponents = { PopupManager, NewPopupElement, SyncedPopup };
export { PopupManager, usePopupState }