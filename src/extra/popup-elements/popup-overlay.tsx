import React, { useLayoutEffect, useState } from "react";

const POPUP_AREA_OVERLAY_THRESHOLD = 50;

interface PopupOverlay {
    popupElement: HTMLDivElement | null,
    forceOverlay: boolean,
}

function PopupOverlay({ popupElement, forceOverlay }: PopupOverlay) {
    const [overlay, setOverlay] = useState(false);
    useLayoutEffect(
        function checkApplyOverlay() {
            if (!popupElement || forceOverlay) return;
            const { offsetWidth, offsetHeight } = popupElement;
            const { clientWidth, clientHeight } = popupElement.ownerDocument.documentElement;
            const popupAreaPercentage = (offsetWidth * offsetHeight) * 100 / (clientWidth * clientHeight);
            setOverlay(popupAreaPercentage > POPUP_AREA_OVERLAY_THRESHOLD);
        },
        [popupElement, forceOverlay]
    );
    const needOverlay = forceOverlay || overlay;
    return needOverlay
        ? <div tabIndex={-1} className='popupOverlay' /> : null;
}

export { PopupOverlay }