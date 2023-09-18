import React from "react";
import clsx from "clsx";
import { useClickSync } from "./exchange/click-sync";
import { ButtonElement } from "./button-element";
import { usePath } from "../main/vdom-hooks";
import { useFocusControl } from "./focus-control";
import { getUserManualUtils, useUserManual } from "./user-manual";

interface FlagElement {
    identity: Object,
    imageSrc: string,
    name: string,
    umid?: string
}

function FlagElement ({ identity, imageSrc, name, umid }: FlagElement) {
    const { clicked, onClick } = useClickSync(identity, 'receiver');

    const path = usePath(identity);
    const { focusClass, focusHtml, isFocused } = useFocusControl(path);

    // User manual logic
    const userManual = useUserManual();
    const umUrl = isFocused && userManual.has(umid) ? userManual.getUrl(umid) : null;
    const {button: umButton, onKeyDown} = getUserManualUtils(umUrl);

    return (
        <div className={clsx('flagElement', focusClass)} {...focusHtml} onKeyDown={onKeyDown} >
            <ButtonElement value={clicked} onClick={onClick} className='flagButton' >
                <img src={imageSrc} />
            </ButtonElement>

            <div className="flagName">{name}</div>
            {umButton}
        </div>
    );
}

export { FlagElement };