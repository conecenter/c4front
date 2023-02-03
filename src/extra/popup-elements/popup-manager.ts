import { createElement as $, createContext, useMemo, useRef, useState, useContext, useCallback } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import { getPath } from "../focus-control";
import { SyncedPopup } from "./synced-popup";
import { NewPopupElement } from "./popup-element";
import { usePatchSync } from "../exchange/patch-sync";
import { useSync } from "../../main/vdom-hooks";

type PopupContext = [string, (change: string) => void, HTMLElement | undefined] | [];

const PopupContext = createContext<PopupContext>([]);

interface PopupManager {
    identity: Object,
    state: string,
    children: ReactNode
}

function PopupManager({identity, state, children}: PopupManager) {
    //const [_, sendClosePopupPatch] = useSync(popupActionIdOf(identity)) as [Patch[], (patch: Patch) => void];
    const { currentState: popup, sendFinalChange: setPopup } =
        usePatchSync(identity, 'receiver', state, false, s => s, (ch: string) => ({value: ch}), p => p.value, (_, ch) => ch);

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