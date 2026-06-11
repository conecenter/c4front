import {createElement} from "react";
import {colorToProps} from "./view-builder/common-api";
import {ColoredDivProps} from "c4f/sapi/ee/cone/c4ui/c4gen.FrontTags";

export function ColoredDiv({color, children}: ColoredDivProps) {
    const {className, style} = colorToProps(color);
    return createElement("div", {style, className}, children)
}