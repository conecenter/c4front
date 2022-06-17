import clsx from 'clsx';
import React, { ReactElement, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { usePopupPos } from '../../main/popup';
import { useClickSync } from '../exchange/click-sync';
import { useInputSync } from '../exchange/input-sync';
import { PathContext, useFocusControl } from '../focus-control';
import { MenuItemState, MenuControlsContext } from './main-menu-bar';
import { handleArrowUpDown, handleEnter, handleMenuBlur, patchToState, stateToPatch } from './main-menu-utils';
import {
    ARROW_DOWN_KEY,
    ARROW_LEFT_KEY,
    ARROW_RIGHT_KEY, 
    ARROW_UP_KEY, 
    ENTER_KEY, 
    ESCAPE_KEY
} from '../../main/keyboard-keys';

const ARROW_DOWN_URL = '/mod/main/ee/cone/core/ui/c4view/arrow-down.svg';

type MenuItem = MenuFolderItem | MenuExecutableItem | MenuCustomItem | MenuUserItem;


interface MenuFolderItem {
    key: string,
	identity: Object,
    name: string,
    shortName?: string,
    current: boolean,
    state: MenuItemState,
    path: string,
    icon?: string,
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
}

function MenuFolderItem({identity, name, shortName, current, state, icon, path, children}: MenuFolderItem) {
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

    const currentPath = useContext(PathContext);
    const onArrowKey = useContext(MenuControlsContext);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const menuFolder = menuFolderRef.current;
        switch(e.key) {
            case ARROW_RIGHT_KEY:
                if (!popupLrMode && !opened) break;
                if (!popupLrMode && opened) {
                    e.stopPropagation();
                    if (onArrowKey && menuFolder) onArrowKey(path, menuFolder, e.key);
                    break;
                }
            case ENTER_KEY:
                if (!opened && menuFolder) {
                    const flatChildren = flattenPopupChildren(children);
                    handleEnter(e, menuFolder, setFinalState, flatChildren);
                }                
                break;
            case ARROW_LEFT_KEY:
                if (!popupLrMode && opened) {
                    e.stopPropagation();
                    if (onArrowKey && menuFolder) onArrowKey(path, menuFolder, e.key);
                    break;
                }
            case ESCAPE_KEY:
                if (opened) {
                    e.stopPropagation();
                    e.currentTarget.focus();
                    setFinalState({ opened: false });
                }
                break;
            case ARROW_DOWN_KEY:
            case ARROW_UP_KEY:
                if (!opened || !menuFolder) break;
                const flatChildren = flattenPopupChildren(children);
                handleArrowUpDown(e, menuFolder, currentPath, flatChildren);
        }
    };

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
            <span className={clsx(shortName && 'longName')}>{name}</span>
            {shortName &&
                <span className='shortName'>{shortName}</span>}
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === ENTER_KEY) {
            e.stopPropagation();
            onClick();
        }
    }
    
    return (
        <div className={clsx('menuItem', current && 'isCurrent', clicked && 'executeAnim', focusClass)}
             {...focusHtml}
             onClick={onClick}
             onKeyDown={handleKeyDown} 
        >
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

function MenuCustomItem({path, children}: MenuCustomItem) {
    const { focusClass, focusHtml } = useFocusControl(path);

    return (
        <div className={clsx(focusClass, 'menuCustomItem')} {...focusHtml} >
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
             onClick={(e) => e.stopPropagation()} >
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
    path: string,
    icon?: string,
    children: ReactElement<MenuItem | MenuItemsGroup>[]
}

const MenuUserItem = (props: MenuUserItem) => (
    <MenuFolderItem {...props} key={'mi-user-item'} shortName={props.shortName} name={props.longName} />
);

export { MenuFolderItem, MenuExecutableItem, MenuCustomItem, MenuItemsGroup, MenuPopupElement, MenuUserItem };
export type { MenuItem };
