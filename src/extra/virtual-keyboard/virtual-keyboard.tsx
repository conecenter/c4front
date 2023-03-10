import React, { CSSProperties, MutableRefObject, useContext, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { getPath, PathContext } from '../focus-control';
import { ColorDef } from '../view-builder/common-api';
import { usePatchSync } from '../exchange/patch-sync';
import { applyChange, changeToPatch, patchToChange, POSITIONING_STYLES, VkChange } from './vk-utils';
import { ScrollInfoContext } from '../scroll-info-context';
import { VKKey } from './vk-key';

const SWITCHER_KEYS = ['Switcher1', 'Switcher2', 'Switcher3'];
const BOTTOM_ROW_CLASS = "bottom-row";
const VK_COL_WIDTH = 3.2;
const VK_ROW_HEIGHT = 3.6;
const VK_OFFSET = 0.2;

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
        let active = true;
        fetch(`/virtualkeyboard/${hash}.json`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not OK');
                return response.json();
            })
            .then(keyboardsData => {
                if (active) setKeyboardTypes(keyboardsData.keyboardTypes)
            })
            .catch(error => console.error('Fetch operation error:', error));
        return () => { active = false }
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

    // Determining VK mode & current keys set
    const currentVkMode = currentState?.find(switchedMode => vkType?.name === switchedMode.vkType);
    const mode = currentVkMode ? (currentVkMode.mode - 1) : 0;
    const currentKeys = vkType?.modes[mode]?.keys || vkType?.modes[0]?.keys;

    // Bottom position logic
    const isBottomPos = position === 'bottom';
    const path = useMemo(() => getPath(identity), [identity]);
    const scrollInfo = useContext(ScrollInfoContext);

    // Positioning logic
    const [ rowsTotal, colsTotal ] = useMemo(() => (currentKeys 
        ? currentKeys.reduce(
            (dimensions, key) => {
                const { row, column, width = 1, height = 1 } = key;
                const rowMax = row + height - 1;
                const rowsTotal = getBiggerNum(rowMax, dimensions[0]);
                const colMax = column + width - 1;
                const colsTotal = getBiggerNum(colMax, dimensions[1]);
                return [rowsTotal, colsTotal];
            }, [0, 0])
        : [0, 0]
    ), [vkType, mode]);

    const keys = useMemo(() => currentKeys?.map((btn, ind) => {
        const { key, symbol, row, column, width = 1, height = 1, color } = btn;
        const btnStyle: CSSProperties = {
            position: 'absolute',
            left: `${(column - 1) * 100 / colsTotal!}%`,
            top: `${VK_ROW_HEIGHT * (row - 1) + VK_OFFSET}em`,
            width: `${width * 100 / colsTotal!}%`,
            height: `${VK_ROW_HEIGHT * height}em`
        }
        const isSwitcher = isSwitcherKey(key);
        const handleClick = setupType || isSwitcher
            ? () => {
                setupType && sendFinalChange({ tp: 'keypress', key });
                isSwitcher && sendFinalChange({ tp: 'modeChange', vkType: vkType!.name, mode: +key.slice(-1) });
            } : undefined;
        return <VKKey key={`${key}-${ind}`} 
                      style={btnStyle} 
                      {...{ keyCode: key, symbol, color }} 
                      handleClick={handleClick} />
    }), [vkType, mode]);

    return (
        <div ref={vkRef}
            className={clsx('vkKeyboard', isBottomPos && BOTTOM_ROW_CLASS)}
            onMouseDownCapture={(e) => e.preventDefault()}
            data-path={path}
            style={{
                height: `${VK_ROW_HEIGHT * rowsTotal + 2 * VK_OFFSET}em`,
                width: `${VK_COL_WIDTH * colsTotal}em`,
                ...POSITIONING_STYLES[position],
                ...isBottomPos && { bottom: scrollInfo.elementsStyles.get(path) }
            }} >
            {keys}
        </div>
    );
}

 function getFocusedInputType(domRef: MutableRefObject<HTMLDivElement | null>, currentPath: string) {
    const cNode = domRef.current?.ownerDocument.querySelector(`[data-path='${currentPath}']`);
    const input = cNode?.querySelector<HTMLInputElement>('input:not([readonly])');
    return input 
        ? input.dataset?.type || 'text'
        : null;
}

function getBiggerNum(a: number, b: number) {
    return a > b ? a : b;
}

function isSwitcherKey(keyCode: string) {
    return SWITCHER_KEYS.includes(keyCode);
}

export type { VkState };
export { VirtualKeyboard };