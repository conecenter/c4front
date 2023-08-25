import React, { ReactElement, useContext, useEffect, useRef, useState, createContext } from 'react';
import clsx from 'clsx';
import { useInputSync } from '../exchange/input-sync';
import { PathContext, useFocusControl } from '../focus-control';
import { MenuItemState, MenuControlsContext } from './main-menu-bar';
import { MenuItem, MenuItemsGroup, MenuPopupElement } from './main-menu-items';
import { flattenMenuChildren, handleArrowUpDown, handleMenuBlur, isMenuItemsGroup, stateToPatch, useItemHiglighter, useOptionHighlighter } from './main-menu-utils';
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

const HighlightedItemContext = createContext('');
HighlightedItemContext.displayName = 'HighlightedItemContext';

const ARROW_DOWN_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className='menuFolderIcon' fill="currentColor" viewBox="0 0 18000 18000" width="18000" height="18000">
        <g><path d="M1646 6819c-546,-544 -549,-1428 -5,-1974 543,-547 1427,-549 1974,-6l5385 5362 5385 -5362c547,-543 1431,-541 1974,6 544,546 541,1430 -5,1974l-6370 6342c-544,541 -1423,542 -1968,0l-6370 -6342z"/></g>
    </svg>
);

interface MenuFolderItem {
    key: string,
	identity: Object,
    name: string,
    shortName?: string,
    current: boolean,
    state: MenuItemState,
    path: string,
    bindSrcId?: string,
    groupId?: string,
    icon?: string,
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
}

function MenuFolderItem(props: MenuFolderItem) {
    const {identity, name, shortName, current, state, icon, path, bindSrcId, groupId, children} = props;

    const {
        currentState: { opened },
        setFinalState
    } = useInputSync(identity, 'receiver', state, false, p => state, s => s, stateToPatch);

    const menuFolderRef = useRef<HTMLDivElement>(null);
    const menuFolder = menuFolderRef.current;

    const [popupLrMode, setPopupLrMode] = useState(false);
    useEffect(() => {
        if (isPopupChild(menuFolder)) setPopupLrMode(true);
    });

    const { focusClass, focusHtml } = useFocusControl(path);
    const currentPath = useContext(PathContext);

    // Keyboard controls logic
    const {onArrowLeftRight, setReadyArrowLeftRight} = useContext(MenuControlsContext);
    useEffect(() => { if (opened) setReadyArrowLeftRight?.() }, [opened]);

    const keyboardOperation = useRef(false);

    //////////////////////////////////////////////////
    const flatChildren = flattenMenuChildren(children);
    const { highlightedItemPath, moveHighlighter } = useOptionHighlighter(flatChildren, opened);

    useItemHiglighter(menuFolderRef, path);

    //////////////////////////////////////////////////

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        console.log({key: e.key, opened, popupLrMode})
        if (keyboardOperation.current === true) {
            e.stopPropagation();
            return;
        }
        switch(e.key) {
            case ARROW_RIGHT_KEY:
                if (!popupLrMode) {
                    e.stopPropagation();
                    if (onArrowLeftRight && menuFolder) onArrowLeftRight(path, menuFolder, e.key, opened);
                    break;
                }
            case ENTER_KEY:
                if (!opened && menuFolder) {
                    keyboardOperation.current = true;
                    e.stopPropagation();
                    setFinalState({ opened: true });
                    setTimeout(() => moveHighlighter(ARROW_DOWN_KEY));
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
                    keyboardOperation.current = true;
                    e.stopPropagation();
                    setFinalState({ opened: false });
                    e.currentTarget.focus();
                }
                break;
            case ARROW_DOWN_KEY:
            case ARROW_UP_KEY:
                /*if (keyboardOperation.current) {
                    e.stopPropagation();
                    break;
                }*/
                if (!opened || !menuFolder) break;
                e.preventDefault();
                e.stopPropagation();
                moveHighlighter(e.key);
                //handleArrowUpDown(e, menuFolder, currentPath, children);
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
                {ARROW_DOWN_ICON}
        
                {opened &&
                    <HighlightedItemContext.Provider value={highlightedItemPath} >
                        <MenuPopupElement popupLrMode={popupLrMode} keyboardOperation={keyboardOperation} >
                            {children}
                        </MenuPopupElement>
                    </HighlightedItemContext.Provider>}
            </BindGroupElement>
        </div>
    );
}

function isPopupChild(element: HTMLElement | null) {
    const parent = element && element.parentElement;
    return parent && parent.classList.contains('popupEl');
}

export { MenuFolderItem, HighlightedItemContext };
