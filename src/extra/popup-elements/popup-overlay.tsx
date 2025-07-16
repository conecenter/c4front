import React, { useLayoutEffect, useState, MouseEvent } from "react";

const POPUP_AREA_OVERLAY_THRESHOLD = 50;

interface PopupOverlay {
    popupElement: HTMLDivElement | null,
    closePopup: () => void,
    forceOverlay: boolean,
    transparent: boolean
}

function PopupOverlay({ popupElement, closePopup, forceOverlay, transparent }: PopupOverlay) {
    const [areaOverlay, setAreaOverlay] = useState(false);
    useLayoutEffect(
        function checkApplyOverlay() {
            if (!popupElement || forceOverlay) return;
            const { offsetWidth, offsetHeight } = popupElement;
            const { clientWidth, clientHeight } = popupElement.ownerDocument.documentElement;
            const popupAreaPercentage = (offsetWidth * offsetHeight) * 100 / (clientWidth * clientHeight);
            setAreaOverlay(popupAreaPercentage > POPUP_AREA_OVERLAY_THRESHOLD);
        },
        [popupElement, forceOverlay]
    );

    const preventFocus = (e: MouseEvent) => e.preventDefault();

    const onClick = (e: MouseEvent) => {
        e.stopPropagation();
        closePopup();
    }

    const isDarkOverlay = forceOverlay || areaOverlay;

    return isDarkOverlay || transparent
        ? <div
            onMouseDown={preventFocus}
            onClick={onClick}
            className='popupOverlay'
            style={{ background: isDarkOverlay ? "rgba(0,0,0,0.4)" : "transparent" }} />
        : null;
}

export { PopupOverlay }