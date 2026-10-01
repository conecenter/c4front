import React, { useContext, useEffect } from "react";
import clsx from "clsx";
import { ButtonElement } from "../button-element";
import { NoCaptionContext, usePath } from "../../main/vdom-hooks";
import { ImageElement } from "../../main/image";
import { usePopupState } from "../popup-elements/popup-manager";
import { PopupElement } from "../popup-elements/popup-element";
import { useClickSyncOpt } from "../exchange/click-sync";
import { LabeledElement } from "../labeled-element";
import { FilterButtonExpanderContext } from "./filter-button-expander";
import { identityAt } from "../../main/vdom-util";
import { MassOpProps } from "types/c4gen.ListApi";

const receiverIdOf = identityAt('receiver');

interface MassOpClientProps extends MassOpProps {
    folderPath?: string
}

function MassOp({ identity, name, nameFolded, color, icon, umid, receiver, folderPath, children }: MassOpClientProps) {
    const path = usePath(identity);

    const closeExpanderRef = useContext(FilterButtonExpanderContext);

    const isInsideExpander = !!closeExpanderRef;
    const isFolder = !!children;

    const popupKey = isInsideExpander ? `${path}/exp-massop` : path;

    const { isOpened, toggle } = usePopupState(isFolder ? popupKey : null);
    const { clicked, onClick: sendClick } = useClickSyncOpt(receiverIdOf(identity), receiver);

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
            <LabeledElement className='menuListBox' umid={umid} >
                <ButtonElement
                    value={clicked} path={path} color={color} onClick={onClick}
                    className={clsx('massOp menuListItem', isFolder && 'isFolder', isOpened && 'isOpened')}
                >
                    {icon &&
                        <ImageElement src={icon} className='textLineSize' color='adaptive' />}
                    {(nameFolded || name) &&
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

export type { MassOpClientProps }
export { MassOp }