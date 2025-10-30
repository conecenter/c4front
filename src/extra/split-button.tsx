import React, { ReactNode, useRef } from "react";
import clsx from "clsx";
import { ButtonElement } from "./button-element";
import { SVGElement } from "../main/image";
import { ColorDef, ColorProps, colorToProps } from "./view-builder/common-api";
import { NoCaptionContext, usePath } from "../main/vdom-hooks";
import { usePopupState } from "./popup-elements/popup-manager";
import { PopupElement } from "./popup-elements/popup-element";
import { useFocusControl } from "./focus-control";
import { useAddEventListener } from "./custom-hooks";
import { OPEN_POPUP } from "./custom-events";

const ARROW_DOWN_URL = '/mod/main/ee/cone/core/ui/c4view/arrow-down.svg';

interface SplitButtonProps {
    identity: object,
    mainButton: ReactNode[],
    color: ColorDef,
    optionalGroup?: ReactNode[]
}

function SplitButton({ identity, mainButton, color, optionalGroup = [] }: SplitButtonProps) {
    const domRef = useRef<HTMLDivElement | null>(null);

    const { style: colorStyle, className: colorClass }: ColorProps = colorToProps(color);

    const path = usePath(identity);

    const { focusClass, focusHtml } = useFocusControl(path);

    const { isOpened, toggle } = usePopupState(path);

    useAddEventListener(domRef, OPEN_POPUP, () => toggle(!isOpened));

    return (
        <div ref={domRef} className={clsx("splitButton", colorClass, focusClass)} style={colorStyle} {...focusHtml} >
            <NoCaptionContext.Provider value={true} >
                {mainButton}

                {optionalGroup.length > 0 && (
                    <>
                        <div className="btnSeparator" />

                        <ButtonElement
                            className={clsx("arrowButton", isOpened && 'rotate180deg')}
                            onClick={() => toggle(!isOpened)}
                            value=''
                        >
                            <SVGElement url={ARROW_DOWN_URL} color="adaptive" />
                        </ButtonElement>

                        {isOpened &&
                            <PopupElement popupKey={path} className="splitBtnPopup" >
                                {optionalGroup}
                            </PopupElement>}
                    </>
                )}
            </NoCaptionContext.Provider>
        </div>
    );
}

export { SplitButton }