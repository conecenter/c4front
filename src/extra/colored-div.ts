import {createElement} from "react";
import {colorToProps} from "./view-builder/common-api";
import {ColoredDivProps} from "types/c4gen.FrontTags";

export function ColoredDiv({color, children}: ColoredDivProps) {
    const {className, style} = colorToProps(color);
    return createElement("div", {style, className}, children)
}