import React, { ReactNode } from "react";
import { ButtonElement } from "./button-element";
import { usePath } from "../main/vdom-hooks";
import { ImageElement } from "../main/image";
import { ColorDef } from "./view-builder/common-api";
import { usePopupState } from "./popup-elements/popup-manager";
import { PopupElement } from "./popup-elements/popup-element";

interface FilterButtonExpander {
    identity: object,
    area: string,
    name?: string,
    color?: ColorDef,
    optButtons: MassOp[],
    // inputValue: string,
}

interface MassOp {
    identity: object,
    area: string,
    name?: string,
    nameFolded?: string,
    icon?: string,
    children?: ReactNode
}

function FilterButtonExpander({ identity, name, color, optButtons = [] }: FilterButtonExpander) {
    const path = usePath(identity);

    const { isOpened, toggle } = usePopupState(path);

    console.log('render FilterButtonExpander', { isOpened });

    return (
        <ButtonElement value='' path={path} color={color} content={name} onClick={() => toggle(!isOpened)} >
            {/*TODO: change image src*/}
            {!name && <ImageElement src='./burger.svg' className='textLineSize' color='adaptive' />}
            {isOpened &&
                <PopupElement popupKey={path}>{optButtons}</PopupElement>}
        </ButtonElement>
    );
}

export { FilterButtonExpander }