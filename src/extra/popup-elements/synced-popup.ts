import { createElement as $, ReactNode, useEffect, useLayoutEffect } from 'react';
import { useSync } from '../../main/vdom-hooks';
import { identityAt } from '../../main/vdom-util';
import { NewPopupElement } from './popup-element';
import { usePopupState } from './popup-manager';

interface SyncedPopup {
    key: string,
    identity: Object,
    children?: ReactNode
}

const popupActionIdOf = identityAt('receiver');
const closePopupPatch = {
    value: "",
    headers: {"x-r-action": "close"}    
};

function SyncedPopup({ identity, children }: SyncedPopup) {
    // Popup opening
    const [isOpened, toggle] = usePopupState(identity);
    useLayoutEffect(() => { toggle(true) }, []);

    // Popup server sync
    const [_, sendClosePopupPatch] = useSync(popupActionIdOf(identity));
    useEffect(() => {
        return () => { isOpened && sendClosePopupPatch(closePopupPatch); }
    }, [isOpened]);

    return $(NewPopupElement, {identity}, children);
}

export { SyncedPopup }