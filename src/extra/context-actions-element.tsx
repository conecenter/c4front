import React, { useContext, useState } from 'react';
import { useUserManual } from './user-manual';
import { ChipElement } from './chip/chip';
import { UiInfoContext } from './ui-info-provider';
import { BottomBarContent } from './bottom-bar-manager';
import { useAddEventListener } from './custom-hooks';

const preventFocusin = (e: React.MouseEvent) => e.preventDefault();

interface ContextActionsElement {
    umid?: string,
    transitionUrl?: string,
    refLE: React.RefObject<HTMLDivElement | null>
}

function ContextActionsElement({ umid, transitionUrl, refLE }: ContextActionsElement) {
    const isFocused = useIsFocused(refLE);

    const { button: umButton, onKeyDown } = useUserManual(umid);
    useAddEventListener(refLE.current, 'keydown', onKeyDown);
 
    const uiType = useContext(UiInfoContext);

    if (!isFocused) return null;

    const contextActionsElems =
        <div className='contextActionsBox' onMouseDown={preventFocusin}>
            {umButton}
            {transitionUrl && <ChipElement
                identity={{}}
                receiver={false}
                tooltip={transitionUrl}
                link={transitionUrl}
                iconPath='/mod/main/ee/cone/core/ui/c4view/link.svg' />}
        </div>

    return uiType === 'touch'
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