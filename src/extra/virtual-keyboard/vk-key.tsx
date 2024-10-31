import React, { CSSProperties } from "react";
import clsx from "clsx";
import { ColorDef, ColorProps, colorToProps } from "../view-builder/common-api";

interface VKKey {
    key: string,
    keyCode: string,
    symbol?: string,
    style: CSSProperties,
    color?: ColorDef,
    handleClick?: () => void
 }

function VKKey({keyCode, symbol, style, color, handleClick }: VKKey) {
    const { style: colorStyle, className }: ColorProps = color ? colorToProps(color) : {};
    const colorClass = className || 'bodyColorCss';

    const key = keyCode === "Space" ? " " : keyCode;

    const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (handleClick) handleClick();
        else {
            const window = (e.target as HTMLButtonElement).ownerDocument.defaultView;
            const customEvent = new KeyboardEvent('keydown', { key, bubbles: true, code: 'vk' });
            window?.dispatchEvent(customEvent);
        }
    }

    return (
        <div className='vkKeyBox' style={style} >
            <button type='button' 
                    className={clsx('vkElement', colorClass)}
                    style={colorStyle}
                    onClick={onClick} >
                {symbol ?? keyCode}
            </button>
        </div>
    );
}

export { VKKey };