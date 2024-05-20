import {CSSProperties} from "react";

type ColorDef = PaletteColor | RawColor

interface ColorType {
    tp: "p" | "r"
}

interface PaletteColor extends ColorType {
    cssClass: string
}

interface RawColor extends ColorType {
    bgColor: string
    textColor: string
}

interface ColorProps {
    className?: string
    style?: CSSProperties
}

export function colorToProps(color?: ColorDef): ColorProps {
    switch (color?.tp) {
        case "p":
            return {
                className: (<PaletteColor>color).cssClass
            }
        case "r":
            return {
                style: {
                    backgroundColor: (<RawColor>color).bgColor,
                    color: (<RawColor>color).textColor
                }
            }
        default:
            return {}
    }
}

export type {ColorDef, ColorProps}
