import React, { CSSProperties } from 'react';

const VK_COL_WIDTH = 2;
const VK_ROW_HEIGHT = 2.2;

interface VirtualKeyboard {
    key: string,
    identity: Object,
    keyboardTypes: {
        // text: KeyboardLayout,
        number: KeyboardLayout,
        // location: KeyboardLayout
    },
    // position: 'left' | 'right' | 'bottom' | 'static',
    // scale: number
}

interface KeyboardLayout {
    [name: string]: {
        rowsTotal: number,
        colsTotal: number,
        buttons: VKButtonData[]
    }
}

interface VKButtonData {
    keyCode: string,
    position: { 
        row: number,
        column: number, 
        width: number, 
        height: number
    },
    name?: string,
    className?: string
}

 function VirtualKeyboard({ keyboardTypes }: VirtualKeyboard) {
    const { rowsTotal, colsTotal } = keyboardTypes.number.base;
    const wrapperStyle: CSSProperties = {
        height: `${VK_ROW_HEIGHT * rowsTotal}em`,
        maxWidth: `${VK_COL_WIDTH * colsTotal}em`,
    }
    return (
        <div style={wrapperStyle} className='virtualKeyboard' >
            {keyboardTypes.number.base.buttons.map((btn, ind) => {
                const { keyCode, position: {row, column, width, height}, name, className } = btn;
                const btnStyle: CSSProperties = {
                    position: 'absolute',
                    left: `${(column - 1) * 100 / colsTotal}%`,
                    top: `${VK_ROW_HEIGHT * (row - 1)}em`,
                    width: `${width * 100 / colsTotal}%`,
                    height: `${VK_ROW_HEIGHT * height}em`,
                }
                return <VKButton key={`${keyCode}-${ind}`} style={btnStyle} {...{keyCode, name, className}} />
            })}
        </div>
    );
 }


 interface VKButton {
    key: string,
    keyCode: string,
    style: CSSProperties,
    className?: string,
    name?: string
 }

 function VKButton({keyCode, style, className, name}: VKButton) {
    return (
        <button type='button' style={style} className={className} >
            {name ?? keyCode}
        </button>
    )
 }

 export { VirtualKeyboard };
