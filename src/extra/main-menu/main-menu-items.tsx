import clsx from 'clsx';
import React, { ReactElement, ReactNode, useEffect, useRef, useState } from 'react'
import { usePopupPos } from '../../main/popup';
import { useClickSync } from '../exchange/click-sync';
import { useInputSync } from '../exchange/input-sync'
import { MenuItemState } from './main-menu-bar';
import { handleMenuBlur, patchToState, stateToPatch } from './main-menu-utils'

const ARROW_DOWN_URL = '/mod/main/ee/cone/core/ui/c4view/arrow-down.svg';

type MenuItem = MenuFolderItem | MenuExecutableItem | MenuCustomItem | MenuUserItem;

interface MenuFolderItem {
    key: string,
	identity: Object,
    name: string,
    current: boolean,
    state: MenuItemState,
    icon?: string,
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
}

function MenuFolderItem({identity, name, current, state, icon, children}: MenuFolderItem) {
    const {
        currentState: { opened },
        setFinalState
    } = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);

    const [popupLrMode, setPopupLrMode] = useState(false);
    const menuFolderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isPopupChild(menuFolderRef.current)) setPopupLrMode(true);
    });

    return (
        <div
            ref={menuFolderRef}
            className={clsx('menuItem', opened && 'menuFolderOpened', current && 'isCurrent')}
            tabIndex={1}
            onBlur={(e) => handleMenuBlur(e, setFinalState)}
            onClick={() => setFinalState({ opened: !opened })}
        >
            {icon && <img src={icon} className='rowIconSize' />}
            <span>{name}</span>
            <img
                src={ARROW_DOWN_URL}
                className='menuFolderIcon'
                alt='arrow-down-icon' />

            {opened &&
                <MenuPopupElement popupLrMode={popupLrMode}>{children}</MenuPopupElement>}
        </div>
    );
}

function isPopupChild(element: HTMLElement | null) {
    const parent = element && element.parentElement;
    return parent && parent.classList.contains('popupEl');
}


interface MenuExecutableItem {
    key: string,
	identity: Object,
    name: string,
    current: boolean,
    icon?: string
}

function MenuExecutableItem({identity, name, current, icon}: MenuExecutableItem) {
    const { clicked, onClick } = useClickSync(identity, 'receiver');
    return (
        <div className={clsx('menuItem', current && 'isCurrent', clicked && 'executeAnim')}
             tabIndex={1}
             onClick={onClick} >
            {icon && <img src={icon} className='rowIconSize'/>}
            <span>{name}</span>
        </div>
    );
}


interface MenuCustomItem {
    key: string,
	identity: Object,
    children?: ReactNode | ReactNode[]
}

function MenuCustomItem({children}: MenuCustomItem) {
    return (
        <div className='menuCustomItem'>
            {children}
        </div>
    );
}


interface MenuPopupElement {
    popupLrMode: boolean,
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
}

function MenuPopupElement({popupLrMode, children}: MenuPopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);
    const [popupPos] = usePopupPos(popupElement, popupLrMode);

    const hasIcon = children ? children.some(hasIconProp) : false;

    return (
        <div ref={setPopupElement}
             className={clsx('menuPopupBox popupEl', hasIcon && 'hasIcons')}
             style={popupPos}
             onClick={(e) => e.stopPropagation()}>
            {children}
        </div>
    );
}

function hasIconProp(child: JSX.Element): string | undefined {
    if (child.type === MenuItemsGroup) {
        return child.props.children.some(hasIconProp);
    }    
    return child.props.icon;
}


interface MenuItemsGroup {
    key: string,
	identity?: Object,
    children: ReactElement<MenuItem>[]
}

function MenuItemsGroup({children}: MenuItemsGroup) {
    return (
        <>
            <hr/>{children}<hr/>
        </>
    );
}


interface MenuUserItem {
    key: string,
	identity: Object,
    shortName: string,
    longName: string,
    current: boolean,
    state: MenuItemState,
    icon?: string,
    children: ReactElement<MenuItem | MenuItemsGroup>[]
}

function MenuUserItem({identity, shortName, longName, current, state, icon, children}: MenuUserItem) {
    const {
        currentState: { opened },
        setFinalState
    } = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);

    const [popupLrMode, setPopupLrMode] = useState(false);
    const menuFolderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isPopupChild(menuFolderRef.current)) setPopupLrMode(true);
    });

    return (
        <div
            ref={menuFolderRef}
            className={clsx('menuItem', opened && 'menuFolderOpened', current && 'isCurrent')}
            tabIndex={1}
            onBlur={(e) => handleMenuBlur(e, setFinalState)}
            onClick={() => setFinalState({ opened: !opened })}
        >
            {icon && <img src={icon} className='rowIconSize' />}
            <span className='longName'>{longName}</span>
            <span className='shortName'>{shortName}</span>
            <img
                src={ARROW_DOWN_URL}
                className='menuFolderIcon'
                alt='arrow-down-icon' />

            {opened &&
                <MenuPopupElement popupLrMode={popupLrMode}>{children}</MenuPopupElement>}
        </div>
    );
}

export { MenuFolderItem, MenuExecutableItem, MenuCustomItem, MenuItemsGroup, MenuPopupElement, MenuUserItem };
export type { MenuItem };
