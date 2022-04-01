import {createElement as el, ReactNode} from "react";
import {ColorDef, colorToProps} from "./common-api";

interface InlineButton {
    key: string
    color: ColorDef
    children: ReactNode[]
}

function InlineButton({key, color, children}: InlineButton) {
    return el("button", {
        ...colorToProps(color)
    }, children)
}

interface InlineChip {
    key: string
    color: ColorDef
    children: ReactNode[]
}

function InlineChip({key, color, children}: InlineButton) {
    return el("button", {
        ...colorToProps(color)
    }, children)
}


export const inlineComponents = {InlineButton, InlineChip}