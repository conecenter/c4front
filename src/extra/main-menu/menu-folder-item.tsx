import React, { ReactElement, useContext, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useInputSync } from '../exchange/input-sync';
import { PathContext, useFocusControl } from '../focus-control';
import { MenuItemState, MenuControlsContext } from './main-menu-bar';
import { MenuItem, MenuItemsGroup, MenuPopupElement } from './main-menu-items';
import { focusIfKeyboardOpened, handleArrowUpDown, handleMenuBlur, stateToPatch } from './main-menu-utils';
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
    bindSrcId?: string,
    groupId?: string,
    icon?: string,
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
}

function MenuFolderItem(props: MenuFolderItem) {
    const {identity, name, shortName, current, state, icon, bindSrcId, groupId, children} = props;

    const {
        currentState: { opened },
        setFinalState
    } = useInputSync(identity, 'receiver', state, false, p => state, s => s, stateToPatch);

    const [popupLrMode, setPopupLrMode] = useState(false);

    const menuFolderRef = useRef<HTMLDivElement>(null);
    const menuFolder = menuFolderRef.current;

    useEffect(() => {
        if (isPopupChild(menuFolder)) setPopupLrMode(true);
    });

    const { focusClass, focusHtml } = useFocusControl(identity);
    // @ts-ignore
    const path = focusHtml["data-path"];
    const currentPath = useContext(PathContext);

    // Keyboard controls logic
    const {onArrowLeftRight, setReadyArrowLeftRight} = useContext(MenuControlsContext);
    useEffect(() => { if (opened) setReadyArrowLeftRight?.() }, [opened]);

    const openedByKeyboard = useRef(false);
    const handleKeyboardOpen = () => focusIfKeyboardOpened(openedByKeyboard, menuFolder, children);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        switch(e.key) {
            case ARROW_RIGHT_KEY:
                if (!popupLrMode) {
                    e.stopPropagation();
                    if (onArrowLeftRight && menuFolder) onArrowLeftRight(path, menuFolder, e.key, opened);
                    break;
                }
            case ENTER_KEY:
                if (!opened && menuFolder) {
                    e.stopPropagation();
                    openedByKeyboard.current = true;
                    setFinalState({ opened: true });
                }
                break;
            case ARROW_LEFT_KEY:
                if (!popupLrMode) {
                    e.stopPropagation();
                    if (onArrowLeftRight && menuFolder) onArrowLeftRight(path, menuFolder, e.key, opened);
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
                handleArrowUpDown(e, menuFolder, currentPath, children);
        }
    };
    
    // Binds mode logic
    const { isBindMode, activeBindGroup } = useBinds();
    useEffect(() => {
        if (!isBindMode || !menuFolder) return;
        const isActiveFolder = menuFolder.querySelector(`[groupid="${activeBindGroup}"]`);
        if (isActiveFolder && !opened) {
            menuFolder.focus();
            setFinalState({ opened: true });
        } else if (!isActiveFolder && opened) {
            menuFolder.focus();
            setFinalState({ opened: false });
        }
    }, [activeBindGroup]);

    return (
        <div ref={menuFolderRef}
            className={clsx('menuItem', opened && 'menuFolderOpened', current && 'isCurrent', focusClass)}
            {...focusHtml}
            onBlur={(e) => handleMenuBlur(e, setFinalState)}
            onClick={() => !isBindMode && setFinalState({ opened: !opened })}
            onKeyDown={handleKeyDown} >

            <BindGroupElement bindSrcId={bindSrcId} groupId={groupId} showBtn={true} >

                {icon && <img src={icon} className='rowIconSize' />}
                <span className={clsx(shortName && 'longName')}>{name}</span>
                {shortName &&
                    <span className='shortName'>{shortName}</span>}
                <img src={ARROW_DOWN_URL} className='menuFolderIcon' alt='arrow-down-icon' />
        
                {opened &&
                    <MenuPopupElement popupLrMode={popupLrMode} handleKeyboardOpen={handleKeyboardOpen} >
                        {children}
                    </MenuPopupElement>}
            </BindGroupElement>
        </div>
    );
}

function isPopupChild(element: HTMLElement | null) {
    const parent = element && element.parentElement;
    return parent && parent.classList.contains('popupEl');
}

export { MenuFolderItem };
