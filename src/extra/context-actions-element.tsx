import React, { cloneElement, ReactElement, useContext, useState } from 'react';
import { useUserManual } from './user-manual';
import { UiInfoContext } from './ui-info-provider';
import { BottomBarContent } from './bottom-bar-manager';
import { useAddEventListener } from './custom-hooks';
import { ChipElement } from './chip/chip';

const preventFocusin = (e: React.MouseEvent) => e.preventDefault();

interface ContextActionsElement {
    umid?: string,
    goToChip?: [ReactElement<ChipElement>],
    refLE: React.RefObject<HTMLDivElement | null>
}

function ContextActionsElement({ umid, goToChip, refLE }: ContextActionsElement) {
    const isFocused = useIsFocused(refLE);

    const { button: umButton, onKeyDown } = useUserManual(umid);
    useAddEventListener(refLE.current, 'keydown', onKeyDown);
 
    const isTouch = useContext(UiInfoContext) === 'touch';

    if (!isFocused) return null;

    const goToElement = isTouch && goToChip
        ? cloneElement(goToChip[0], { text: goToChip[0].props.tooltip })
        : goToChip;

    const contextActionsElems =
        <div className='contextActionsBox' onMouseDown={preventFocusin}>
            {umButton}
            {goToElement}
        </div>

    return isTouch
        ? <BottomBarContent>{contextActionsElems}</BottomBarContent>
        : contextActionsElems;
}

function useIsFocused(refLE: React.RefObject<HTMLDivElement | null>) {
    const [isFocused, setIsFocused] = useState(false);
    const onFocus = () => !isFocused && setIsFocused(true);
    const onBlur = (e: FocusEvent) => {
        if ((e.currentTarget as Node)?.contains(e.relatedTarget as Node | null)) return;
        setIsFocused(false);
    }
    useAddEventListener(refLE, 'focusin', onFocus);
    useAddEventListener(refLE, 'focusout', onBlur);
    return isFocused;
}

export { ContextActionsElement };