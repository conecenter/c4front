import React from "react";
import clsx from "clsx";
import { useClickSync } from "./exchange/click-sync";
import { ButtonElement } from "./button-element";
import { usePath } from "../main/vdom-hooks";
import { useFocusControl } from "./focus-control";
import { useUserManual } from "./user-manual";
import { Identity } from "./utils";

interface FlagElement {
    identity: Identity,
    imageSrc: string,
    name: string,
    umid?: string
}

function FlagElement ({ identity, imageSrc, name, umid }: FlagElement) {
    const { clicked, onClick } = useClickSync(identity, 'receiver');

    const path = usePath(identity);
    const { focusClass, focusHtml, isFocused } = useFocusControl(path);

    // User manual logic
    const {button: umButton, onKeyDown} = useUserManual(isFocused, umid);

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