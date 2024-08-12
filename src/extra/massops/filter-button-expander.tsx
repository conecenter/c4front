import React, { createContext, FunctionComponentElement, MutableRefObject } from "react";
import { ButtonElement } from "../button-element";
import { NoCaptionContext, usePath } from "../../main/vdom-hooks";
import { ImageElement } from "../../main/image";
import { ColorDef } from "../view-builder/common-api";
import { usePopupState } from "../popup-elements/popup-manager";
import { PopupElement } from "../popup-elements/popup-element";
import { FilteringInput } from "./filtering-input";
import { MassOp } from "./filter-massop";
import { useLatest } from "../custom-hooks";

const FilterButtonExpanderContext = createContext<MutableRefObject<() => void> | null>(null);
FilterButtonExpanderContext.displayName = 'FilterButtonExpanderContext';

interface FilterButtonExpander {
    identity: object,
    area: string,
    name?: string,
    color?: ColorDef,
    optButtons: FunctionComponentElement<MassOp>[]
    filterValue?: string,
}

function FilterButtonExpander({ identity, name, color, optButtons = [], filterValue }: FilterButtonExpander) {
    const path = usePath(identity);
    const { isOpened, toggle } = usePopupState(path);
    const closeExpanderRef = useLatest(() => toggle(false));
    return (
        <ButtonElement value='' path={path} className='filterButtonExpander' color={color} onClick={() => toggle(!isOpened)} >
            {/*TODO: change image src*/}
            {!name && <ImageElement src='./burger.svg' className='textLineSize' color='adaptive' />}
            {name}
            {isOpened &&
                <PopupElement popupKey={path}>
                    <FilterButtonExpanderContext.Provider value={closeExpanderRef}>
                        <NoCaptionContext.Provider value={true}>
                            <FilteringInput identity={identity} filterValue={filterValue} path={path} />
                            {optButtons}
                        </NoCaptionContext.Provider>
                    </FilterButtonExpanderContext.Provider>
                </PopupElement>}
        </ButtonElement>
    );
}

export { FilterButtonExpander, FilterButtonExpanderContext }