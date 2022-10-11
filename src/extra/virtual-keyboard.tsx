import React, { CSSProperties, MutableRefObject, useContext, useRef, useState } from 'react';
import clsx from 'clsx';
import { PathContext } from './focus-control';
import { ColorDef } from './view-builder/common-api';


const BOTTOM_ROW_CLASS = "bottom-row";
const VK_COL_WIDTH = 2;
const VK_ROW_HEIGHT = 2.2;

interface PositioningStyles {
    [name: string]: CSSProperties
}

const POSITIONING_STYLES: PositioningStyles = {
    bottom: {
        position: 'fixed',
        bottom: '0',
        right: '0',
        left: '0',
        margin: 'auto'
    },
    left: {
        position: 'fixed',
        left: '0',
        top: '0',
        bottom: '0',
        margin: 'auto'
    },
    right: {
        position: 'fixed',
        right: '0',
        top: '0',
        bottom: '0',
        margin: 'auto'
    },
    static: {
        position: 'relative'
    }
}

interface VirtualKeyboard {
    key: string,
    identity: Object,
    keyboardTypes: KeyboardType[],
    position: "left" | "right" | "bottom" | "static",
    setupType?: string
}

interface KeyboardType {
    name: string,   // TODO: text, number, location ?
    modes: KeyboardMode[]   // TODO: change to [ Key[] ] ? why another object?
}

interface KeyboardMode {
    keys: Key[]
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

function VirtualKeyboard({ keyboardTypes, setupType, position }: VirtualKeyboard) {
    const vkRef = useRef<HTMLDivElement | null>(null);
    
    // Show VK logic
    const [showVk, setShowVk] = useState(false);
    const currentPath = useContext(PathContext);
    const inputInFocus = getInputInFocus(vkRef, currentPath);
    if (setupType || inputInFocus) !showVk && setShowVk(true);
    else showVk && setShowVk(false);
    if (!showVk) return null;

    // Get keyboard type
    const keyboardTypeName = setupType || inputInFocus?.dataset?.type || 'text';
    const keyboardType = keyboardTypes.find(type => type.name === keyboardTypeName);
    if (!keyboardType) return null;

    // Positioning logic
    const [ rowsTotal, colsTotal ] = keyboardType.modes[0].keys.reduce((dimensions, key) => {
        const { row, column, width, height } = key;
        const colMax = column + width - 1;
        const rowsTotal =  colMax > dimensions[0] ? colMax : dimensions[0]; // TODO: function!
        const rowMax = row + height - 1;
        const colsTotal = rowMax > dimensions[1] ? rowMax : dimensions[1];
        return [rowsTotal, colsTotal];
    }, [0, 0]);    

    const wrapperStyle: CSSProperties = {
        height: `${VK_ROW_HEIGHT * rowsTotal}em`,
        width: `${VK_COL_WIDTH * colsTotal}em`,
        ...POSITIONING_STYLES[position]
    }
    return (
            <div ref={vkRef}  
                 style={wrapperStyle} 
                 className={clsx('vkKeyboard', position === 'bottom' && BOTTOM_ROW_CLASS)} >

                {keyboardType.modes[0].keys.map((btn, ind) => {
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

 function getInputInFocus(domRef: MutableRefObject<HTMLDivElement | null>, currentPath: string) {
    const cNode = domRef.current?.ownerDocument.querySelector(`[data-path]=${currentPath}`);
    const input = cNode?.querySelector<HTMLInputElement>('input:not([readonly])');
    return input;
}


 interface VKKey {
    key: string,
    keyCode: string,
    symbol?: string,
    style: CSSProperties
 }

 function VKKey({keyCode, symbol, style}: VKKey) {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        const window = (e.target as HTMLButtonElement).ownerDocument.defaultView;
        const customEvent = new KeyboardEvent('keydown', { key: keyCode, bubbles: true, code: 'vk' });
        window?.dispatchEvent(customEvent);
    }
    return (
        <button type='button' 
                className='vkElement' 
                style={style} 
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClick} >
            {symbol ?? keyCode}
        </button>
    )
 }

 export { VirtualKeyboard };