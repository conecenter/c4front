import React, { CSSProperties, MutableRefObject, useContext, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { PathContext } from './focus-control';
import { ColorDef, ColorProps, colorToProps } from './view-builder/common-api';
import { usePatchSync } from './exchange/patch-sync';

const BOTTOM_ROW_CLASS = "bottom-row";
const VK_COL_WIDTH = 3.3;
const VK_ROW_HEIGHT = 3.7;

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
    name: string,
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

    // Exchange with server in setup mode
    const handleClick = useVKSyncOpt(identity, 'receiver', !!setupType);

    // Get keyboard types data
    const [keyboardTypes, setKeyboardTypes] = useState<KeyboardType[] | null>(null);
    useEffect(() => {
        fetch(`/virtualkeyboard/${hash}.json`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not OK');
            return response.json();
        })
        .then(keyboardsData => setKeyboardTypes(keyboardsData.keyboardTypes))
        .catch(error => console.error('Fetch operation error:', error))
    }, [hash]);
    
    // Get VK parameters
    const [vkType, setVkType] = useState<KeyboardType>();
    const currentPath = useContext(PathContext);
    useEffect(() => {
        const inputType = setupType || getFocusedInputType(vkRef, currentPath);
        if (keyboardTypes && inputType) {
            const keyboardType = keyboardTypes.find(type => type.name === inputType) 
                || keyboardTypes.find(type => type.name === 'text');
            setVkType(keyboardType);
        }
        else setVkType(undefined);
    }, [currentPath, setupType, keyboardTypes]);

    // Positioning logic
    const [ rowsTotal, colsTotal ] = useMemo(() => (vkType 
        ? vkType.modes[0].keys.reduce(
            (dimensions, key) => {
                const { row, column, width, height } = key;
                const rowMax = row + height - 1;
                const rowsTotal = getBiggerNum(rowMax, dimensions[0]);
                const colMax = column + width - 1;
                const colsTotal = getBiggerNum(colMax, dimensions[1]);
                return [rowsTotal, colsTotal];
            }, [0, 0])
        : [0, 0]
    ), [vkType]);

    const keys = useMemo(() => vkType?.modes[0].keys.map((btn, ind) => {
        const { key, symbol, row, column, width, height, color } = btn;
        const btnStyle: CSSProperties = {
            position: 'absolute',
            left: `${(column - 1) * 100 / colsTotal!}%`,
            top: `${VK_ROW_HEIGHT * (row - 1)}em`,
            width: `${width* 100 / colsTotal!}%`,
            height: `${VK_ROW_HEIGHT * height}em`
        }
        return <VKKey key={`${key}-${ind}`} style={btnStyle} {...{ keyCode: key, symbol, color }} handleClick={handleClick} />
    }), [vkType]);

    return vkType ? (
        <div ref={vkRef}
            className={clsx('vkKeyboard', 'headerLighterColorCss', position === 'bottom' && BOTTOM_ROW_CLASS)} 
            style={{
                height: `${VK_ROW_HEIGHT * rowsTotal}em`,
                width: `${VK_COL_WIDTH * colsTotal}em`,
                ...POSITIONING_STYLES[position]
            }} >
            {keys}
        </div>
        ) : null;
}

 function getFocusedInputType(domRef: MutableRefObject<HTMLDivElement | null>, currentPath: string) {
    const cNode = domRef.current?.ownerDocument.querySelector(`[data-path='${currentPath}']`);
    const input = cNode?.querySelector<HTMLInputElement>('input:not([readonly])');
    return input?.dataset?.type;
}

function getBiggerNum(a: number, b: number) {
    return a > b ? a : b;
}

function useVKSyncOpt(
    identity: Object,
    receiverName: string,
    needsReceiver?: boolean
  ) {
    const {sendFinalChange} = usePatchSync<string, string, string>(
        identity,
        receiverName,
        '',
        false,
        (b) => b,
        (ch) => ({
            headers: {"x-r-key": ch},
            value: ""
        }),
        (p) => '',
        (prevState, ch) => ch
    );
    const onClick = needsReceiver ? (ch: string) => sendFinalChange(ch) : undefined;
    return onClick;
  }


 interface VKKey {
    key: string,
    keyCode: string,
    symbol?: string,
    style: CSSProperties,
    color?: ColorDef,
    handleClick?: (ch: string) => void
 }

 function VKKey({keyCode, symbol, style, color, handleClick}: VKKey) {
    const { style: colorStyle, className }: ColorProps = color ? colorToProps(color) : {};
    const colorClass = className || 'bodyColorCss';

    const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        const window = (e.target as HTMLButtonElement).ownerDocument.defaultView;
        const customEvent = new KeyboardEvent('keydown', { key: keyCode, bubbles: true, code: 'vk' });
        window?.dispatchEvent(customEvent);
        handleClick && handleClick(keyCode);
    }

    return (
        <div className='vkKeyBox' style={style} >
            <button type='button' 
                    className={clsx('vkElement', colorClass)}
                    style={colorStyle}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onClick} >
                {symbol ?? keyCode}
            </button>
        </div>
    );
}

 export { VirtualKeyboard }