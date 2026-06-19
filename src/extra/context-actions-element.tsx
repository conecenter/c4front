import React, { ReactElement, useContext, useState } from 'react';
import { useUserManual } from './user-manual';
import { UiInfoContext } from './ui-info-provider';
import { useAddEventListener } from './custom-hooks';

const preventFocusin = (e: React.MouseEvent) => e.preventDefault();

interface ContextActionsElement {
    umid?: string,
    goToChip?: ReactElement[],
    refLE: React.RefObject<HTMLDivElement | null>
}

function ContextActionsElement({ umid, goToChip, refLE }: ContextActionsElement) {
    const isFocused = useIsFocused(refLE);

    const { button: umButton, onKeyDown } = useUserManual(umid);
    useAddEventListener(refLE, 'keydown', onKeyDown);
 
    const isTouch = useContext(UiInfoContext) === 'touch';

    if (!isFocused || isTouch) return null;

    // const goToElement = isTouch && goToChip
    //     ? cloneElement(goToChip[0], { text: goToChip[0].props.tooltip })
    //     : goToChip;
    if (!(umButton || goToChip)) return null;

    const contextActionsElems = (
        <div className='contextActionsBox' onMouseDown={preventFocusin}>
            {umButton}
            {goToChip}
        </div>
    );

    // <BottomBarElement id={`umid-${umid ?? ''}`}>{contextActionsElems}</BottomBarElement>
    return contextActionsElems;
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