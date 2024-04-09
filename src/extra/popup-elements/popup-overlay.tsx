import React, { useLayoutEffect, useState } from "react";

const POPUP_AREA_OVERLAY_THRESHOLD = 50;

interface PopupOverlay {
    popupElement: HTMLDivElement | null,
    overlayProp: boolean,
}

function PopupOverlay({ popupElement, overlayProp }: PopupOverlay) {
    const [overlay, setOverlay] = useState(false);
    useLayoutEffect(
        function checkApplyOverlay() {
            if (!popupElement || overlayProp) return;
            const { offsetWidth, offsetHeight } = popupElement;
            const { clientWidth, clientHeight } = popupElement.ownerDocument.documentElement;
            const popupAreaPercentage = (offsetWidth * offsetHeight) * 100 / (clientWidth * clientHeight);
            setOverlay(popupAreaPercentage > POPUP_AREA_OVERLAY_THRESHOLD);
        },
        [popupElement, overlayProp]
    );
    const needOverlay = overlayProp || overlay;
    return needOverlay
        ? <div tabIndex={-1} className='popupOverlay' /> : null;
}

export { PopupOverlay }