import React, { createContext, FunctionComponentElement, ReactNode, useContext } from "react";
import clsx from "clsx";
import { ButtonElement } from "./button-element";
import { usePath } from "../main/vdom-hooks";
import { ImageElement } from "../main/image";
import { ColorDef } from "./view-builder/common-api";
import { usePopupState } from "./popup-elements/popup-manager";
import { PopupElement } from "./popup-elements/popup-element";
import { useClickSync } from "./exchange/click-sync";

const FilterButtonExpanderContext = createContext(false);
FilterButtonExpanderContext.displayName = 'FilterButtonExpanderContext';

interface FilterButtonExpander {
    identity: object,
    area: string,
    name?: string,
    color?: ColorDef,
    optButtons: FunctionComponentElement<MassOp>[]
    // inputValue: string,
}

function FilterButtonExpander({ identity, name, color, optButtons = [] }: FilterButtonExpander) {
    const path = usePath(identity);
    const { isOpened, toggle } = usePopupState(path);
    return (
        <ButtonElement value='' path={path} className='filterButtonExpander' color={color} onClick={() => toggle(!isOpened)} >
            {/*TODO: change image src*/}
            {!name && <ImageElement src='./burger.svg' className='textLineSize' color='adaptive' />}
            {name}
            {isOpened &&
                <PopupElement popupKey={path}>
                    <FilterButtonExpanderContext.Provider value={true}>
                        {optButtons}
                    </FilterButtonExpanderContext.Provider>
                </PopupElement>}
        </ButtonElement>
    );
}

interface MassOp {
    identity: object,
    area: string,
    name: string,
    nameFolded?: string,
    color?: ColorDef,
    hint?: string,
    isFolder?: boolean,
    icon?: string,
    children?: ReactNode
}

function MassOp({ identity, name, nameFolded, color, hint, isFolder, icon, children }: MassOp) {
    const path = usePath(identity);
    const { isOpened, toggle } = usePopupState(isFolder ? path : null);
    const { clicked, onClick: sendClick } = useClickSync(identity, 'receiver');

    // ignores case when another list inside folder's popup
    const isInsideExpander = useContext(FilterButtonExpanderContext);

    function onClick() {
        sendClick();
        isFolder && toggle(!isOpened);
    }

    const isFolderOpened = isOpened && children;

    return (
        <ButtonElement
            value={clicked} path={path} color={color} hint={hint} onClick={onClick}
            className={clsx('massOp', isFolder && 'isFolder', isFolderOpened && 'isOpened')}
        >
            {icon &&
                <ImageElement src={icon} className='textLineSize' color='adaptive' />}
            {nameFolded &&
                <span className='nameFolded'>{nameFolded}</span>}
            {name &&
                <span className={clsx(nameFolded && 'nameFull')}>{name}</span>}

            {isFolderOpened &&
                <PopupElement popupKey={path} lrMode={isInsideExpander}>{children}</PopupElement>}
        </ButtonElement>
    );
}

export { FilterButtonExpander, MassOp }