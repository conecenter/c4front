import React, { ReactElement, useContext, useEffect } from "react";
import clsx from "clsx";
import { ButtonElement } from "../button-element";
import { NoCaptionContext, usePath } from "../../main/vdom-hooks";
import { ImageElement } from "../../main/image";
import { ColorDef } from "../view-builder/common-api";
import { usePopupState } from "../popup-elements/popup-manager";
import { PopupElement } from "../popup-elements/popup-element";
import { useClickSyncOpt } from "../exchange/click-sync";
import { LabeledElement } from "../labeled-element";
import { FilterButtonExpanderContext } from "./filter-button-expander";
import { Identity } from "../utils";

interface MassOp {
    identity: Identity,
    area: string,
    name?: string,
    nameFolded?: string,
    color?: ColorDef,
    icon?: string,
    umid?: string,
    receiver: boolean,
    folderPath?: string,  // front only
    children?: ReactElement[]
}

function MassOp({ identity, name, nameFolded, color, icon, umid, receiver, folderPath, children }: MassOp) {
    const path = usePath(identity);

    const closeExpanderRef = useContext(FilterButtonExpanderContext);

    const isInsideExpander = !!closeExpanderRef;
    const isFolder = !!children;

    const popupKey = isInsideExpander ? `${path}/exp-massop` : path;

    const { isOpened, toggle } = usePopupState(isFolder ? popupKey : null);
    const { clicked, onClick: sendClick } = useClickSyncOpt(identity, 'receiver', receiver);

    function onClick() {
        sendClick?.();
        isFolder && toggle(!isOpened);
    }

    useEffect(function closeExpanderAfterAction() {
        return () => {
            if (!isFolder && clicked) closeExpanderRef?.current();
        }
    }, [clicked]);

    return (
        <NoCaptionContext.Provider value={true}>
            <LabeledElement className='massOpBox' umid={umid} >
                <ButtonElement
                    value={clicked} path={path} color={color} onClick={onClick}
                    className={clsx('massOp', isFolder && 'isFolder', isOpened && 'isOpened')}
                >
                    {icon &&
                        <ImageElement src={icon} className='textLineSize' color='adaptive' />}
                    {nameFolded || name &&
                        <span className='text'>{isInsideExpander && nameFolded || name}</span>}

                    {folderPath &&
                        <span className='folderPath'>{folderPath}</span>}

                    {isOpened &&
                        <PopupElement popupKey={popupKey} lrMode={isInsideExpander} children={children} />}
                </ButtonElement>
            </LabeledElement>
        </NoCaptionContext.Provider>
    );
}

export { MassOp }