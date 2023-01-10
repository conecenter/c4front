import clsx from "clsx";
import React, { CSSProperties } from "react";
import { ColorDef, colorToProps } from "./view-builder/common-api"

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

function getFontStyles(fontStyles: FontStyle[] | undefined) {
    return fontStyles?.reduce((acc: CSSProperties, currStyle: FontStyle): CSSProperties  => {
        switch (currStyle) {
            case 'b':
                return { ...acc, fontWeight: 'bold' };
            case 'i':
                return { ...acc, fontStyle: 'italic' };
            case 'm':
                return { ...acc, fontFamily: 'monospace' };
        }
    }, {});
}

export { RichTextElement };