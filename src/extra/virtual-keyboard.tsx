import React, { CSSProperties, MutableRefObject, useContext, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { PathContext } from './focus-control';
import { ColorDef, ColorProps, colorToProps } from './view-builder/common-api';

const BOTTOM_ROW_CLASS = "bottom-row";
const VK_COL_WIDTH = 2;
const VK_ROW_HEIGHT = 2.2;

const FIXED_STYLES: CSSProperties = {
    position: 'fixed',
    bottom: '0',
    margin: 'auto'
}

interface PositioningStyles {
    [name: string]: CSSProperties
}

const POSITIONING_STYLES: PositioningStyles = {
    bottom: {
        ...FIXED_STYLES,
        right: '0',
        left: '0'
    },
    left: {
        ...FIXED_STYLES,
        left: '0',
        top: '0'
    },
    right: {
        ...FIXED_STYLES,
        right: '0',
        top: '0'
    },
    static: {
        position: 'relative'
    }
}

interface VirtualKeyboard {
    key: string,
    identity: Object,
    hash: string,
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

function VirtualKeyboard({ identity, hash, position, setupType }: VirtualKeyboard) {
    const vkRef = useRef<HTMLDivElement | null>(null);

    // Get keyboard types data
    const [keyboardTypes, setKeyboardTypes] = useState<KeyboardType[] | null>(null);
    useEffect(() => {
        fetch(`/virtualkeyboard/${hash}.json`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not OK');
            return response.json();
        })
        .then(keyboardsData => setKeyboardTypes(keyboardsData))
        .catch(error => console.error('Fetch operation error:', error))
    }, [hash]);

    console.log(keyboardTypes);
    
    // Show VK logic
    const [showVk, setShowVk] = useState(false);
    const currentPath = useContext(PathContext);
    const inputType = useRef('text');
    useEffect(() => {
        if (!keyboardTypes) {
            setShowVk(false);
            return;
        };
        const inputInFocus = getInputInFocus(vkRef, currentPath);
        if (setupType || inputInFocus) {
            inputType.current = inputInFocus?.dataset?.type || 'text';
            setShowVk(true);
        }
        else if (showVk) setShowVk(false);
    }, [currentPath, setupType, keyboardTypes]);
    

    // Get keyboard type
    const keyboardTypeName = setupType || inputType.current;
    const keyboardType = keyboardTypes?.find(type => type.name === keyboardTypeName);

    // Positioning logic
    const [ rowsTotal, colsTotal ] = useMemo(() => (keyboardType 
        ? keyboardType.modes[0].keys.reduce(
            (dimensions, key) => {
                const { row, column, width, height } = key;
                const colMax = column + width - 1;
                const rowsTotal = getBiggerNum(colMax, dimensions[0]);
                const rowMax = row + height - 1;
                const colsTotal = getBiggerNum(rowMax, dimensions[1]);
                return [rowsTotal, colsTotal];
            }, [0, 0])
        : []
    ), [keyboardType]);
    /*const [ rowsTotal, colsTotal ] = keyboardType.modes[0].keys.reduce(
        (dimensions, key) => {
            const { row, column, width, height } = key;
            const colMax = column + width - 1;
            const rowsTotal = getBiggerNum(colMax, dimensions[0]);
            const rowMax = row + height - 1;
            const colsTotal = getBiggerNum(rowMax, dimensions[1]);
            return [rowsTotal, colsTotal];
        }, [0, 0]);*/

    const keys = useMemo(() => keyboardType?.modes[0].keys.map((btn, ind) => {
        const { key, symbol, row, column, width, height, color } = btn;
        const btnStyle: CSSProperties = {
            position: 'absolute',
            left: `${(column - 1) * 100 / colsTotal!}%`,
            top: `${VK_ROW_HEIGHT * (row - 1)}em`,
            width: `${width * 100 / colsTotal!}%`,
            height: `${VK_ROW_HEIGHT * height}em`
        }
        return <VKKey key={`${key}-${ind}`} style={btnStyle} {...{ keyCode: key, symbol, color }} />
    }), [keyboardType]);

    return showVk
        ? (
            <div ref={vkRef}
                 className={clsx('vkKeyboard', position === 'bottom' && BOTTOM_ROW_CLASS)} 
                 style={{
                    height: `${VK_ROW_HEIGHT * rowsTotal!}em`,
                    width: `${VK_COL_WIDTH * colsTotal!}em`,
                    ...POSITIONING_STYLES[position]
                }} >
                {keys}
            </div>
        ) : null;
        
}

 function getInputInFocus(domRef: MutableRefObject<HTMLDivElement | null>, currentPath: string) {
    const cNode = domRef.current?.ownerDocument.querySelector(`[data-path]=${currentPath}`);
    const input = cNode?.querySelector<HTMLInputElement>('input:not([readonly])');
    return input;
}

function getBiggerNum(a: number, b: number) {
    return a > b ? a : b;
}


 interface VKKey {
    key: string,
    keyCode: string,
    symbol?: string,
    style: CSSProperties,
    color?: ColorDef
 }

 function VKKey({keyCode, symbol, style, color}: VKKey) {
    const { style: colorStyle, className }: ColorProps = color ? colorToProps(color) : {};
    const colorClass = className || 'headerLighterColorCss';

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        const window = (e.target as HTMLButtonElement).ownerDocument.defaultView;
        const customEvent = new KeyboardEvent('keydown', { key: keyCode, bubbles: true, code: 'vk' });
        window?.dispatchEvent(customEvent);
    }

    return (
        <button type='button' 
                className={clsx('vkElement', colorClass)}
                style={{ ...style, ...colorStyle }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClick} >
            {symbol ?? keyCode}
        </button>
    )
 }

 export { VirtualKeyboard }