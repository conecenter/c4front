import React, { ReactNode, useContext } from "react";
import clsx from "clsx";
import { ButtonElement } from "../button-element";
import { NoCaptionContext, usePath } from "../../main/vdom-hooks";
import { ImageElement } from "../../main/image";
import { ColorDef } from "../view-builder/common-api";
import { usePopupState } from "../popup-elements/popup-manager";
import { PopupElement } from "../popup-elements/popup-element";
import { useClickSync } from "../exchange/click-sync";
import { LabeledElement } from "../labeled-element";
import { FilterButtonExpanderContext } from "./filter-button-expander";

interface MassOp {
    identity: object,
    area: string,
    name: string,
    nameFolded?: string,
    color?: ColorDef,
    hint?: string,
    isFolder?: boolean,
    icon?: string,
    umid?: string,
    children?: ReactNode
}

function MassOp({ identity, name, nameFolded, color, hint, isFolder, icon, umid, children }: MassOp) {
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
        <NoCaptionContext.Provider value={true}>
            <LabeledElement umid={umid} >
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
                        <PopupElement popupKey={path} lrMode={isInsideExpander} children={children} />}
                </ButtonElement>
            </LabeledElement>
        </NoCaptionContext.Provider>
    );
}

export { MassOp }