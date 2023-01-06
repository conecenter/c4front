import clsx from "clsx";
import React from "react";
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

const formatRow = (row: Text[]) => row.map(({text, color}, ind) => {
    const {className, style} = colorToProps(color);
    return <span key={`${text}-${ind}`} className={className} style={style}>{text}</span>
});

export { RichTextElement };