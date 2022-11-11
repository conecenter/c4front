import React, { ReactNode, useEffect, useState } from 'react';
import { usePopupPos } from '../main/popup';
import { NoCaptionContext } from '../main/vdom-hooks';
import { usePatchSync } from './exchange/patch-sync';

interface SyncedPopup {
    key: string,
    identity: Object,
    blurElementPath?: string,
    children?: ReactNode[]
}

function SyncedPopup({ identity, blurElementPath, children }: SyncedPopup) {
    const {popupOpen, closePopup} = usePopupSync(identity, 'receiver');

    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);
    const [popupStyle] = usePopupPos(popupElement);

    function handleBlur(e: FocusEvent) {
        const doc = e.currentTarget as Document;
        const blurElementRef = (blurElementPath && doc.querySelector(`[data-path='${blurElementPath}']`)) || popupElement;
		if (e.relatedTarget instanceof Node && blurElementRef?.contains(e.relatedTarget)) return;
        else closePopup();
	}
    
    useEffect(() => {
        const doc = popupElement?.ownerDocument;
        doc?.addEventListener('focusout', handleBlur);
        return () => doc?.removeEventListener('focusout', handleBlur);
    }, [popupElement]);

    return popupOpen ? (
        <div ref={setPopupElement} className='popupEl' style={popupStyle} >
            <NoCaptionContext.Provider value={false} >
                {children}
            </NoCaptionContext.Provider>
        </div>
        ) : null;
}

function usePopupSync(identity: Object, receiverName: string) {
    const {currentState, sendFinalChange} = usePatchSync<boolean, boolean, boolean>(
        identity,
        receiverName,
        true,
        false,
        (b) => b,
        (b) => ({
            headers: {"x-r-action": "close"},
            value: ""
        }),
        (p) => false,
        (prevState, ch) => ch
    );
    return {
        popupOpen: currentState,
        closePopup: () => sendFinalChange(false)
    };
}

export { SyncedPopup };