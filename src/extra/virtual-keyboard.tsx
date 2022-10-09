import React, { CSSProperties } from 'react';
import { ColorDef } from './view-builder/common-api';

const VK_COL_WIDTH = 2;
const VK_ROW_HEIGHT = 2.2;

interface VirtualKeyboard {
    key: string,
    identity: Object,
    keyboardTypes: KeyboardType[],
    position: "left" | "right" | "bottom" | "static"
}

interface KeyboardType {
    name: string,   // TODO: text, number, location ?
    modes: KeyboardMode[]   // TODO: change to [ Key[] ] ? why another object?
}

interface KeyboardMode {
    keys: Key[],
    rowsTotal: number,  // TODO ?
    colsTotal: number   // TODO ?
}

interface Key {
    key: string,
    symbol?: string,
    row: number,
    column: number, 
    width: number, 
    height: number,
    color?: ColorDef
}

 function VirtualKeyboard({ keyboardTypes }: VirtualKeyboard) {
    // @ts-ignore
    const { rowsTotal, colsTotal } = keyboardTypes[0].modes[0];
    const wrapperStyle: CSSProperties = {
        height: `${VK_ROW_HEIGHT * rowsTotal}em`,
        maxWidth: `${VK_COL_WIDTH * colsTotal}em`,
    }
    return (
        <div style={wrapperStyle} className='virtualKeyboard' >
            {keyboardTypes[0].modes[0].keys.map((btn, ind) => {
                const { key, symbol, row, column, width, height } = btn;
                const btnStyle: CSSProperties = {
                    position: 'absolute',
                    left: `${(column - 1) * 100 / colsTotal}%`,
                    top: `${VK_ROW_HEIGHT * (row - 1)}em`,
                    width: `${width * 100 / colsTotal}%`,
                    height: `${VK_ROW_HEIGHT * height}em`,
                }
                return <VKKey key={`${key}-${ind}`} style={btnStyle} {...{ keyCode: key, symbol }} />
            })}
        </div>
    );
 }


 interface VKKey {
    key: string,
    keyCode: string,
    symbol?: string,
    style: CSSProperties    
 }

 function VKKey({keyCode, symbol, style}: VKKey) {
    return (
        <button type='button' style={style} >
            {symbol ?? keyCode}
        </button>
    )
 }

 export { VirtualKeyboard };
