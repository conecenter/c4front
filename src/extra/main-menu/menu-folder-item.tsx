import React, { useContext, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useFocusControl } from '../focus-control';
import { MenuControlsContext } from './main-menu-bar';
import { MenuItemsGroup } from './main-menu-items';
import { focusFirstMenuItem, handleArrowUpDown } from './main-menu-utils';
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
import { SVGElement } from '../../main/image';
import { PathContext } from "../focus-announcer";
import { usePopupState } from '../popup-elements/popup-manager';
import { PopupElement } from '../popup-elements/popup-element';
import type { MenuFolderItemProps } from 'types/c4gen.MainMenuApi';

const ARROW_DOWN_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" className='menuFolderIcon' fill="currentColor" viewBox="0 0 18000 18000" width="18000" height="18000">
        <g><path d="M1646 6819c-546,-544 -549,-1428 -5,-1974 543,-547 1427,-549 1974,-6l5385 5362 5385 -5362c547,-543 1431,-541 1974,6 544,546 541,1430 -5,1974l-6370 6342c-544,541 -1423,542 -1968,0l-6370 -6342z"/></g>
    </svg>
);

function MenuFolderItem(props: MenuFolderItemProps & { shortName?: string }) {
    const {name, shortName, current, popupKey, icon, path, bindSrcId, groupId, children} = props;

    const { isOpened: isPopupAdded, toggle } = usePopupState(popupKey);
    const openPopup = () => toggle(true);
    const closePopup = () => toggle(false);

    const isOpened = Boolean(isPopupAdded && children);

    const menuFolderRef = useRef<HTMLDivElement>(null);
    const menuFolder = menuFolderRef.current;

    const [popupLrMode, setPopupLrMode] = useState(false);
    useEffect(() => {
        if (isPopupChild(menuFolder)) setPopupLrMode(true);
    });

    const { focusClass, focusHtml } = useFocusControl(path);
    const currentPath = useContext(PathContext);

    // Keyboard controls logic
    const keyboardOperation = useRef(false);

    const {onArrowLeftRight, setReadyArrowLeftRight} = useContext(MenuControlsContext);
    useEffect(() => {
        if (isOpened) {
            setReadyArrowLeftRight?.();
            if (keyboardOperation.current) {
                setTimeout(() => focusFirstMenuItem(menuFolder, children));
                keyboardOperation.current = false;
            }
        }
    }, [isOpened, setReadyArrowLeftRight]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (keyboardOperation.current) {
            e.stopPropagation();
            return;
        }
        switch(e.key) {
            case ARROW_RIGHT_KEY:
                if (!popupLrMode) {
                    e.stopPropagation();
                    if (onArrowLeftRight && menuFolder) onArrowLeftRight(path, menuFolder, e.key, isOpened);
                    break;
                }
                // fall through
            case ENTER_KEY:
                if (!isOpened && menuFolder) {
                    keyboardOperation.current = true;
                    e.stopPropagation();
                    openPopup();
                }
                break;
            case ARROW_LEFT_KEY:
                if (!popupLrMode) {
                    e.stopPropagation();
                    if (onArrowLeftRight && menuFolder) onArrowLeftRight(path, menuFolder, e.key, isOpened);
                    break;
                }
                // fall through
            case ESCAPE_KEY:
                if (isOpened) {
                    e.stopPropagation();
                    e.currentTarget.focus();
                    closePopup();
                }
                break;
            case ARROW_DOWN_KEY:
            case ARROW_UP_KEY:
                if (!isOpened || !menuFolder) break;
                handleArrowUpDown(e, menuFolder, currentPath, children);
        }
    };

    // Binds mode logic
    const { isBindMode, activeBindGroup } = useBinds();
    useEffect(() => {
        if (!isBindMode || !menuFolder) return;
        const isActiveFolder = menuFolder.querySelector(`[groupid="${activeBindGroup}"]`);
        if (isActiveFolder && !isOpened) {
            menuFolder.focus();
            openPopup();
        } else if (!isActiveFolder && isOpened) {
            menuFolder.focus();
            closePopup();
        }
    }, [activeBindGroup]);

    const hasIcon = children ? children.some(hasIconProp) : false;

    return (
        <div ref={menuFolderRef}
            className={clsx('menuItem', isOpened && 'menuFolderOpened', current && 'isCurrent', focusClass)}
            {...focusHtml}
            onClick={() => !isBindMode && toggle(!isOpened)}
            onKeyDown={handleKeyDown} >
            <BindGroupElement bindSrcId={bindSrcId} groupId={groupId} showBtn={true} >

                {icon && <SVGElement url={icon} className='menuItemIcon' />}
                <span className={clsx(shortName && 'longName')}>{name}</span>
                {shortName &&
                    <span className='shortName'>{shortName}</span>}
                {ARROW_DOWN_ICON}

                {isOpened && children &&
                    <PopupElement
                        popupKey={popupKey}
                        lrMode={popupLrMode}
                        className={clsx('menuPopupBox', hasIcon && 'hasIcons')}
                        keyboardOverride={true}
                        children={children}
                    />}
            </BindGroupElement>
        </div>
    );
}

function isPopupChild(element: HTMLElement | null) {
    const parent = element && element.parentElement;
    return parent && parent.classList.contains('popupEl');
}

function hasIconProp(child: JSX.Element): string | undefined {
    if (child.type === MenuItemsGroup) {
        return child.props.children.some(hasIconProp);
    }
    return child.props.icon;
}

export { MenuFolderItem };