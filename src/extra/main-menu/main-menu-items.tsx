import clsx from 'clsx';
import React, { ReactElement, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { ARROW_DOWN_KEY, ARROW_UP_KEY, ENTER_KEY, ESCAPE_KEY, KEY_TO_DIRECTION } from '../../main/keyboard-keys';
import { usePopupPos } from '../../main/popup';
import { useClickSync } from '../exchange/click-sync';
import { useInputSync } from '../exchange/input-sync';
import { PathContext, useFocusControl } from '../focus-control';
import { MenuItemState } from './main-menu-bar';
import { handleMenuBlur, patchToState, stateToPatch } from './main-menu-utils';

const ARROW_DOWN_URL = '/mod/main/ee/cone/core/ui/c4view/arrow-down.svg';

type MenuItem = MenuFolderItem | MenuExecutableItem | MenuCustomItem | MenuUserItem;

interface MenuFolderItem {
    key: string,
	identity: Object,
    name: string,
    current: boolean,
    state: MenuItemState,
    path?: string,
    icon?: string,
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
}

function MenuFolderItem({identity, name, current, state, icon, path, children}: MenuFolderItem) {
    const {
        currentState: { opened },
        setFinalState
    } = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);

    const [popupLrMode, setPopupLrMode] = useState(false);
    const menuFolderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isPopupChild(menuFolderRef.current)) setPopupLrMode(true);
    });

    const { focusClass, focusHtml } = useFocusControl(path);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === ENTER_KEY) {
            e.currentTarget.click();
            e.stopPropagation();
            // @ts-ignore
            const pathToFocus = children && children[0].props.path;
                setTimeout(() => {
                    if (pathToFocus && menuFolderRef.current) {
                        const itemToFocus: HTMLElement | null = menuFolderRef.current.querySelector(`[data-path='${pathToFocus}']`);
                        itemToFocus?.focus();
                    }
                }, 0);
        }
        if (e.key === ESCAPE_KEY && opened) {
            e.currentTarget.focus();
            setFinalState({ opened: false });
            e.stopPropagation();
        }
    }

    return (
        <div
            ref={menuFolderRef}
            className={clsx('menuItem', opened && 'menuFolderOpened', current && 'isCurrent', focusClass)}
            {...focusHtml}
            onBlur={(e) => handleMenuBlur(e, setFinalState)}
            onClick={() => setFinalState({ opened: !opened })}
            onKeyDown={handleKeyDown}
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
    path?: string,
    icon?: string
}

function MenuExecutableItem({identity, name, current, path, icon}: MenuExecutableItem) {
    const { clicked, onClick } = useClickSync(identity, 'receiver');

    const { focusClass, focusHtml } = useFocusControl(path);
    
    return (
        <div className={clsx('menuItem', current && 'isCurrent', clicked && 'executeAnim', focusClass)}
             {...focusHtml}
             onClick={onClick} >
            {icon && <img src={icon} className='rowIconSize'/>}
            <span>{name}</span>
        </div>
    );
}


interface MenuCustomItem {
    key: string,
	identity: Object,
    path?: string,
    children?: ReactNode
}

function MenuCustomItem({children}: MenuCustomItem) {
    return (
        <div className='menuCustomItem' >
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

    const currentPath = useContext(PathContext);
    
    const flatChildren = flattenPopupChildren(children);

    const hasIcon = children ? children.some(hasIconProp) : false;

    const getNextArrayIndex = (arrLength: number, currIndex: number, direction: string = 'up') => {
        switch(direction) {
            case 'up':
                return currIndex === 0 ? arrLength - 1 : currIndex - 1;                
            case 'down':
                return arrLength <= currIndex + 1 ? 0 : currIndex + 1;
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch(e.key) {
            case ARROW_DOWN_KEY:
            case ARROW_UP_KEY:
                const focusedIndex = flatChildren.findIndex(child => child.props.path === currentPath);
                if (focusedIndex === -1) break;
                const nextFocusedIndex = getNextArrayIndex(flatChildren.length, focusedIndex, KEY_TO_DIRECTION[e.key]);
                if (nextFocusedIndex === undefined) break;
                const pathToFocus = flatChildren[nextFocusedIndex].props.path;
                if (pathToFocus && popupElement) {
                    const itemToFocus: HTMLElement | null = popupElement.querySelector(`[data-path='${pathToFocus}']`);
                    itemToFocus && itemToFocus.focus();
                }
                e.preventDefault();
                e.stopPropagation();
        }
    }

    return (
        <div ref={setPopupElement}
             className={clsx('menuPopupBox popupEl', hasIcon && 'hasIcons')}
             style={popupPos}
             onClick={(e) => e.stopPropagation()}
             onKeyDown={handleKeyDown}>
            {children}
        </div>
    );
}

function isMenuItemsGroup(item: ReactElement<MenuItem | MenuItemsGroup>): item is ReactElement<MenuItemsGroup> { 
    return (item as ReactElement<MenuItemsGroup>).type === MenuItemsGroup; 
  }

function flattenPopupChildren(children?: ReactElement<MenuItem | MenuItemsGroup>[]): ReactElement<MenuItem>[] {
    if (!children) return [];
    return children.reduce((res: ReactElement<MenuItem>[], child) => {
        return res.concat(
            // @ts-ignore
            isMenuItemsGroup(child)
                ? flattenPopupChildren(child.props.children)
                : child
        );
    }, [])
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
    path?: string,
    icon?: string,
    children: ReactElement<MenuItem | MenuItemsGroup>[]
}

function MenuUserItem({identity, shortName, longName, current, state, path, icon, children}: MenuUserItem) {
    const {
        currentState: { opened },
        setFinalState
    } = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);

    const [popupLrMode, setPopupLrMode] = useState(false);
    const menuFolderRef = useRef<HTMLDivElement>(null);

    const { focusClass, focusHtml } = useFocusControl(path);

    useEffect(() => {
        if (isPopupChild(menuFolderRef.current)) setPopupLrMode(true);
    });

    return (
        <div
            ref={menuFolderRef}
            className={clsx('menuItem', opened && 'menuFolderOpened', current && 'isCurrent', focusClass)}
            {...focusHtml}
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
