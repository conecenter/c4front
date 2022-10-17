import React, { CSSProperties, MutableRefObject, useContext, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { PathContext } from '../focus-control';
import { ColorDef } from '../view-builder/common-api';
import { usePatchSync } from '../exchange/patch-sync';
import { applyChange, changeToPatch, patchToChange, POSITIONING_STYLES, VkChange } from './vk-utils';
import { VKKey } from './vk-key';

const SWITCHER_KEYS = ['Switcher1', 'Switcher2', 'Switcher3'];
const BOTTOM_ROW_CLASS = "bottom-row";
const VK_COL_WIDTH = 3.2;
const VK_ROW_HEIGHT = 3.6;

interface VirtualKeyboard {
    key: string,
    identity: Object,
    hash: string,
    position: "left" | "right" | "bottom" | "static",
    setupType?: string,
    switchedMode?: VkState
}

type VkState = SwitchedMode[] | undefined;

interface SwitchedMode {
    vkType: string,
    mode: number
}

interface KeyboardType {
    name: string,
    modes: KeyboardMode[]
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

function VirtualKeyboard({ identity, hash, position, setupType, switchedMode }: VirtualKeyboard) {
    const vkRef = useRef<HTMLDivElement | null>(null);

    // Exchange with server
    const {currentState, sendFinalChange} = usePatchSync<VkState, VkState, VkChange>(
        identity,
        'receiver',
        switchedMode,
        false,
        b => b,
        changeToPatch,
        patchToChange,
        applyChange
    );

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

    // Determining VK mode
    const currentVkMode = currentState?.find(switchedMode => vkType?.name === switchedMode.vkType);
    const mode = currentVkMode ? (currentVkMode.mode - 1) : 0;

    // Positioning logic
    const [ rowsTotal, colsTotal ] = useMemo(() => (vkType 
        ? vkType.modes[mode].keys.reduce(
            (dimensions, key) => {
                const { row, column, width, height } = key;
                const rowMax = row + height - 1;
                const rowsTotal = getBiggerNum(rowMax, dimensions[0]);
                const colMax = column + width - 1;
                const colsTotal = getBiggerNum(colMax, dimensions[1]);
                return [rowsTotal, colsTotal];
            }, [0, 0])
        : [0, 0]
    ), [vkType, mode]);

    const keys = useMemo(() => vkType?.modes[mode].keys.map((btn, ind) => {
        const { key, symbol, row, column, width, height, color } = btn;
        const btnStyle: CSSProperties = {
            position: 'absolute',
            left: `${(column - 1) * 100 / colsTotal!}%`,
            top: `${VK_ROW_HEIGHT * (row - 1)}em`,
            width: `${width* 100 / colsTotal!}%`,
            height: `${VK_ROW_HEIGHT * height}em`
        }
        const handleClick = () => {
            if (setupType) sendFinalChange({ tp: 'keypress', key });
            if (isSwitcherKey(key)) sendFinalChange({ tp: 'modeChange', vkType: vkType.name, mode: +key.slice(-1) + 1 });
        }
        return <VKKey key={`${key}-${ind}`} 
                      style={btnStyle} 
                      {...{ keyCode: key, symbol, color }} 
                      handleClick={handleClick} />
    }), [vkType, mode]);

    return vkType ? (
        <div ref={vkRef}
            className={clsx('vkKeyboard', (position === 'bottom') && BOTTOM_ROW_CLASS)} 
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

function isSwitcherKey(keyCode: string) {
    return SWITCHER_KEYS.includes(keyCode);
}

export type { VkState };
export { VirtualKeyboard };