import { useLayoutEffect, useState } from "react";

const POPUP_AREA_OVERLAY_THRESHOLD = 50;

function useAreaOverlay(popupElement: HTMLElement | null, forceOverlay: boolean) {
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
    return areaOverlay;
}

export { useAreaOverlay }