import React, { ReactElement, useContext, useEffect } from "react";
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
    folderPath?: string,  // front only
    children?: ReactElement[]
}

function MassOp({ identity, name, nameFolded, color, hint, isFolder, icon, umid, folderPath, children }: MassOp) {
    const path = usePath(identity);
    const { isOpened, toggle } = usePopupState(isFolder ? path : null);
    const { clicked, onClick: sendClick } = useClickSync(identity, 'receiver');

    function onClick() {
        sendClick();
        isFolder && toggle(!isOpened);
    }
    
    const closeExpanderRef = useContext(FilterButtonExpanderContext);
    useEffect(function closeExpanderAfterAction() {
        return () => {
            if (!isFolder && clicked) closeExpanderRef?.current();
        }
    }, [clicked]);

    const isInsideExpander = !!closeExpanderRef;
    const isFolderOpened = isOpened && children;

    return (
        <NoCaptionContext.Provider value={true}>
            <LabeledElement className='massOpBox' umid={umid} >
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
                    
                    {folderPath &&
                        <span className='folderPath'>{folderPath}</span>}

                    {isFolderOpened &&
                        <PopupElement popupKey={path} lrMode={isInsideExpander} children={children} />}
                </ButtonElement>
            </LabeledElement>
        </NoCaptionContext.Provider>
    );
}

export { MassOp }