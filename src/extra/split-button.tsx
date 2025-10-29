import React, { ReactElement, ReactNode } from "react";
import clsx from "clsx";
import { ButtonElement } from "./button-element";
import { SVGElement } from "../main/image";
import { ColorProps, colorToProps } from "./view-builder/common-api";
import { usePath } from "../main/vdom-hooks";
import { usePopupState } from "./popup-elements/popup-manager";
import { PopupElement } from "./popup-elements/popup-element";

interface SplitButtonProps {
    identity: object,
    mainButton: ReactElement<ButtonElement>,
    optionalGroup?: ReactNode[]
}

function SplitButton({ identity, mainButton, optionalGroup = [] }: SplitButtonProps) {
    const { style: colorStyle, className: colorClass }: ColorProps = colorToProps(mainButton.props.color);

    const path = usePath(identity);

    const { isOpened, toggle } = usePopupState(path);

    return (
        <div className={clsx("splitButton", colorClass)} style={colorStyle}>
            {mainButton}

            {optionalGroup.length > 0 && (
                <>
                    <div className="btnSeparator" />

                    <ButtonElement
                        className={clsx("arrowButton", isOpened && 'rotate180deg')}
                        onClick={() => toggle(!isOpened)}
                        value=''
                    >
                        <SVGElement url="./images/arrow-down.svg" color="adaptive" />
                    </ButtonElement>

                    {isOpened &&
                        <PopupElement popupKey={path} className="splitBtnPopup" >
                            {optionalGroup}
                        </PopupElement>}
                </>
            )}
        </div>
    )
}

export { SplitButton }