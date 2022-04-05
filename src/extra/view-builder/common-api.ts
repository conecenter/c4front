import {CSSProperties, HTMLAttributes} from "react";

interface ColorDef {
    tp: "p" | "r"
}

interface PaletteColor extends ColorDef {
    cssClass: string
}

interface RawColor extends ColorDef {
    bgColor: string
    textColor: string
}

interface ColorProps {
    className?: string
    style?: CSSProperties
}

export function colorToProps<T>(color: ColorDef): ColorProps {
    switch (color.tp) {
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

export type {ColorDef}
