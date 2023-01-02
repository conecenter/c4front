import clsx from "clsx";
import React from "react";
import { ColorDef, colorToProps } from "./view-builder/common-api"

interface RichTextElement {
    text: Row[],
    color?: ColorDef
}

interface Row {
    row: Text[]
}

interface Text {
    key: string,
    text: string,
    color?: ColorDef 
}

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

const formatRow = (row: Text[]) => row.map(({key, text, color}) => {
    const {className, style} = colorToProps(color);
    return <span key={key} className={className} style={style}>{text}</span>
});

export { RichTextElement };