import React, { ReactElement, ReactNode, useEffect, useState } from 'react';
import clsx from 'clsx';
import { usePopupPos } from '../../main/popup';
import { useClickSync } from '../exchange/click-sync';
import { useFocusControl } from '../focus-control';
import { MenuItem, MenuItemState } from './main-menu-bar';
import { ENTER_KEY } from '../../main/keyboard-keys';
import { MenuFolderItem } from './menu-folder-item';
import { BindingElement } from '../binds/binds-elements';
import { useBinds } from '../binds/key-binding';
import { focusFirstMenuItem } from './main-menu-utils';


interface MenuExecutableItem {
    key: string,
	identity: Object,
    name: string,
    current: boolean,
    path?: string,
    icon?: string,
    bindSrcId?: string
}

function MenuExecutableItem({identity, name, current, path, icon, bindSrcId}: MenuExecutableItem) {
    const { clicked, onClick } = useClickSync(identity, 'receiver');

    const { focusClass, focusHtml } = useFocusControl(path);

    const { isBindMode } = useBinds();

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
            {isBindMode && <BindingElement bindSrcId={bindSrcId} onChange={onClick} />}
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
    keyboardOperation: React.MutableRefObject<boolean>,
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
}

function MenuPopupElement({popupLrMode, keyboardOperation, children}: MenuPopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);
    const [popupPos] = usePopupPos(popupElement, popupLrMode);

    const hasIcon = children ? children.some(hasIconProp) : false;

    useEffect(() => {
        if (popupPos.visibility !== 'hidden' && keyboardOperation.current) {
            focusFirstMenuItem(popupElement, children);
            keyboardOperation.current = false;
        }
        return () => { 
            if (popupPos.visibility !== 'hidden') keyboardOperation.current = false; 
        }
    }, [popupPos.visibility]);

    return (
        <div ref={setPopupElement}
             className={clsx('menuPopupBox popupEl', hasIcon && 'hasIcons')}
             style={popupPos}
             onClick={(e) => e.stopPropagation()} >
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
    path: string,
    icon?: string,
    bindSrcId?: string,
    groupId?: string,
    children: ReactElement<MenuItem | MenuItemsGroup>[]
}

const MenuUserItem = (props: MenuUserItem) => (
    <MenuFolderItem {...props} key={'mi-user-item'} shortName={props.shortName} name={props.longName} />
);


export { MenuExecutableItem, MenuCustomItem, MenuItemsGroup, MenuPopupElement, MenuUserItem };
export type { MenuItem };
