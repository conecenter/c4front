import React, { MouseEvent } from "react";

interface PopupOverlay {
    closePopup: () => void,
    isModalMode: boolean,
    transparent: boolean
}

function PopupOverlay({ closePopup, isModalMode, transparent }: PopupOverlay) {
    const preventFocus = (e: MouseEvent) => e.preventDefault();

    const onClick = (e: MouseEvent) => {
        e.stopPropagation();
        closePopup();
    }

    return isModalMode || transparent
        ? <div
            onMouseDown={preventFocus}
            onClick={onClick}
            className='popupOverlay'
            style={{ background: isModalMode ? "rgba(0,0,0,0.4)" : "transparent" }} />
        : null;
}

export { PopupOverlay }