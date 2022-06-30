import React, { ReactElement, useContext, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useInputSync } from '../exchange/input-sync';
import { PathContext, useFocusControl } from '../focus-control';
import { MenuItemState, MenuControlsContext } from './main-menu-bar';
import { MenuItem, MenuItemsGroup, MenuPopupElement } from './main-menu-items';
import { handleArrowUpDown, handleEnter, handleMenuBlur, patchToState, stateToPatch } from './main-menu-utils';
import {
    ARROW_DOWN_KEY,
    ARROW_LEFT_KEY,
    ARROW_RIGHT_KEY, 
    ARROW_UP_KEY, 
    ENTER_KEY, 
    ESCAPE_KEY
} from '../../main/keyboard-keys';
import { BindGroupElement } from '../binds/binds-elements';
import { useBinds } from '../binds/key-binding';

const ARROW_DOWN_URL = '/mod/main/ee/cone/core/ui/c4view/arrow-down.svg';

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
                    const flatChildren = flattenMenuChildren(children);
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
                const flatChildren = flattenMenuChildren(children);
                handleArrowUpDown(e, menuFolder, currentPath, flatChildren);
        }
    };
    
    /* or use additionChange from binds logic?
    const { activeBindGroup } = useBinds();
    useEffect(() => {
        const isActiveGroup = activeBindGroup === 'folder-mi-wht-management';
        if (isActiveGroup && !opened) {
            setFinalState({ opened: true });
        } else if (!isActiveGroup && opened) setFinalState({ opened: false });
    }, [activeBindGroup])
    */

    return (
        <div
            ref={menuFolderRef}
            className={clsx('menuItem', opened && 'menuFolderOpened', current && 'isCurrent', focusClass)}
            {...focusHtml}
            onBlur={(e) => handleMenuBlur(e, setFinalState)}
            onClick={() => setFinalState({ opened: !opened })}
            onKeyDown={handleKeyDown} >

            <BindGroupElement bindSrcId='row-0-button-srcId' groupId='folder-mi-wht-management' showBtn={true}>
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
            </BindGroupElement>
        </div>
    );
}

function isPopupChild(element: HTMLElement | null) {
    const parent = element && element.parentElement;
    return parent && parent.classList.contains('popupEl');
}

function isMenuItemsGroup(item: ReactElement<MenuItem | MenuItemsGroup>): item is ReactElement<MenuItemsGroup> { 
    return (item as ReactElement<MenuItemsGroup>).type === MenuItemsGroup; 
  }

function flattenMenuChildren(children?: ReactElement<MenuItem | MenuItemsGroup>[]): ReactElement<MenuItem>[] {
    if (!children) return [];
    return children.reduce((res: ReactElement<MenuItem>[], child) => {
        return res.concat(
            // @ts-ignore
            isMenuItemsGroup(child)
                ? flattenMenuChildren(child.props.children)
                : child
        );
    }, [])
}

export { MenuFolderItem };
