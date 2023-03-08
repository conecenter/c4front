import clsx from "clsx";
import React, { CSSProperties } from "react";
import { ColorDef, colorToProps } from "./view-builder/common-api"

const STYLES_MAP: {[index: string]: CSSProperties} = {
    b: { fontWeight: 'bold' },
    i: { fontStyle: 'italic' },
    m: { fontFamily: 'monospace' }
}

interface RichTextElement {
    key: string,
    text: Row[],
    color?: ColorDef
}

interface Row {
    row: Text[]
}

interface Text {
    text: string,
    color?: ColorDef,
    fontStyle?: FontStyle[]
    fontSize?: number
}

type FontStyle = 'b' | 'i' | 'm'    // bold, italic, monospace


function RichTextElement({text, color}: RichTextElement) {
    const formattedText = text.map(currRow => [
        ...formatRow(currRow.row),
        <br key='br'></br>
    ]);
    const {className, style} = colorToProps(color);
    return (
        <p className={clsx('richTextElement', className)} style={style}>{formattedText}</p>
    );
}

const getFontStyles = (fontStyles: FontStyle[] | undefined) => fontStyles?.reduce(
    (acc: CSSProperties, currStyle: FontStyle): CSSProperties  => ({ ...acc, ...STYLES_MAP[currStyle] }), {});

function formatRow(row: Text[]) {
    return row.map(({text, color, fontSize, fontStyle}, ind) => {
        const {className, style: colorStyle} = colorToProps(color);
        const style: CSSProperties = {
            ...colorStyle,
            ...getFontStyles(fontStyle),
            fontSize: fontSize && `${fontSize}em`
        }
        return <span key={`${text}-${ind}`} className={className} style={style}>{text}</span>
    });
}

export { RichTextElement };