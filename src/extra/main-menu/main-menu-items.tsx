import clsx from 'clsx';
import React, { ReactElement, ReactNode, useEffect, useRef, useState } from 'react'
import { usePopupPos } from '../../main/popup';
import { useInputSync } from '../input-sync'
import { MenuItemState } from './main-menu-bar';
import { handleMenuBlur, patchToState, stateToPatch } from './main-menu-utils'

type MenuItem = MenuFolderItem | MenuExecutableItem | MenuCustomItem;

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
            className={clsx('menuItem', !icon && 'noIcon', opened && 'menuFolderOpened', current && 'isCurrent')}
            tabIndex={1}
            onBlur={(e) => handleMenuBlur(e, setFinalState)}
            onClick={() => setFinalState({ opened: !opened })}
        >
            {icon && <img src={icon} className='rowIconSize' />}
            <span>{name}</span>
            <img 
                src='..\datepicker\arrow-down.svg' 
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
    state: MenuItemState,
    icon?: string
}

function MenuExecutableItem({identity, name, current, state, icon}: MenuExecutableItem) {
    const {
        currentState: { opened },
        setFinalState 
    } = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);

    return (
        <div 
            className={clsx('menuItem', !icon && 'noIcon', current && 'isCurrent', opened && 'executeAnim')}
            tabIndex={1} 
            onClick={() => setFinalState({ opened: true })}
        >
            {icon && <img src={icon} className='rowIconSize'/>}
            <span>{name}</span>
        </div>
    );
}


interface MenuCustomItem {
    key: string,
	identity: Object,
    children?: ReactNode[]
}

function MenuCustomItem({children}: MenuCustomItem) {
    return (
        <div className='menuItem'>
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

    return (
        <div 
            ref={setPopupElement} 
            className='menuPopupBox popupEl' 
            style={popupPos} 
            onClick={(e) => e.stopPropagation()}>
            {children}
        </div>
    );
}


interface MenuItemsGroup {
    key: string,
	identity: Object,
    children: ReactElement<MenuItem>[]
}

function MenuItemsGroup({children}: MenuItemsGroup) {
    return (
        <>
            <hr/>{children}<hr/>
        </>
    );
}

export { MenuFolderItem, MenuExecutableItem, MenuCustomItem, MenuItemsGroup, MenuPopupElement };
export type { MenuItem };