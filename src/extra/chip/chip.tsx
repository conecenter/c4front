import React, { useState, useEffect, ReactNode } from 'react'
import clsx from 'clsx'
import closeImg from './close.svg'
import { ImageElement, SVGElement } from '../../main/image'
import { useFocusControl } from '../focus-control'
import { copyToClipboard } from '../utils'
import { ColorDef, colorToProps } from '../view-builder/common-api'
import { useClickSyncOpt } from '../exchange/click-sync'
import { usePath } from '../../main/vdom-hooks'
import { identityAt } from '../../main/vdom-util'

const receiverIdOf = identityAt('receiver');
const delActionIdOf = identityAt('delAction');

interface ChipElement {
    identity: object,
    receiver?: boolean,
    delAction?: boolean,
    text?: string,
    color?: ColorDef,
    tooltip?: string,
    iconPath?: string,
    link?: string,
    onClick?: () => void,
    callbackRef?: (elem: HTMLDivElement | null) => void,
    children?: ReactNode
}

const ChipElement = ({identity, receiver, delAction, text = '', color, tooltip, iconPath, link, callbackRef, children, ...props}: ChipElement) => {
    const { onClick } = useClickSyncOpt(receiverIdOf(identity), receiver);
    const { onClick: onDelete } = useClickSyncOpt(delActionIdOf(identity), delAction);

    const path = usePath(identity);
    const { focusClass, focusHtml } = useFocusControl(path);

    // Copy text feedback
    const [copyState, setCopyState] = useState(false);
    useEffect(() => {
        if (copyState) setTimeout(() => setCopyState(false), 150);
    }, [copyState]);

    const readOnly = !(onClick || props.onClick || link);

    const { className: colorClass, style: rawColorStyle } = colorToProps(color);

    const className = clsx('button chipItem', colorClass, focusClass);

    const inlineStyle = {
        ...!readOnly && {cursor: 'pointer'},
        ...!text && {minWidth: '0.5em'},
        ...copyState && {userSelect: 'text' as const},
        ...rawColorStyle
    };

    async function handleClick(e: React.MouseEvent<HTMLDivElement>) {
        if (readOnly && !e.ctrlKey) return;
        e.stopPropagation();
        const window = e.currentTarget.ownerDocument.defaultView;
        if (e.ctrlKey) {
            window?.getSelection()?.selectAllChildren(e.currentTarget);
            const isCopied = await copyToClipboard(text);
            if (isCopied) setCopyState(true);
            return;
        }
        if (link) window?.open(link, "_self");
        onClick?.();
        props.onClick?.();
    }

    return (
        <div ref={callbackRef} style={inlineStyle} className={className} title={tooltip} onClick={handleClick} {...focusHtml} >
            {iconPath && <ImageElement {...props} key="chipIcon" src={iconPath} color='adaptive' className='chipIcon' />}
            {text && <span className='chipLabel'>{text}</span>}
            {delAction &&
                <SVGElement url={closeImg} className='closeIcon' onClick={onDelete} style={{ cursor: 'pointer' }} />}
            {children}
        </div>
    );
}

export { ChipElement }