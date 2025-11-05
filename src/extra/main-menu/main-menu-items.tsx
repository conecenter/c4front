import React, { ReactElement, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { SVGElement } from '../../main/image';
import { identityAt } from '../../main/vdom-util';
import { Identity } from '../utils';
import { useSender } from '../../main/vdom-hooks';
import { VISIBLE_CHILD_SELECTOR } from '../css-selectors';
import { PopupDrawerContext } from '../popup-elements/popup-contexts';
import { useAddEventListener } from '../custom-hooks';
import { elementsContainTarget } from '../popup-elements/popup-element';

const receiverIdOf = identityAt('receiver');

interface MenuExecutableItem {
    key: string,
	identity: Identity,
    name: string,
    current: boolean,
    path?: string,
    icon?: string,
    bindSrcId?: string
}

function MenuExecutableItem({identity, name, current, path, icon, bindSrcId}: MenuExecutableItem) {
    const { clicked, onClick } = useClickSync(receiverIdOf(identity));

    const { focusClass, focusHtml } = useFocusControl(path);

    const { isBindMode } = useBinds();

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === ENTER_KEY) {
            e.stopPropagation();
            onClick();
        }
    }

    return (
        <div className={clsx('menuItem', current && 'isCurrent', clicked && 'executeAnim', focusClass)}
             {...focusHtml}
             onClick={handleClick}
             onKeyDown={handleKeyDown}
        >
            {isBindMode && <BindingElement bindSrcId={bindSrcId} onChange={onClick} />}
            {icon && <SVGElement url={icon} className='menuItemIcon'/>}
            <span>{name}</span>
        </div>
    );
}


interface MenuCustomItem {
    key: string,
	identity: Identity,
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
    closePopup: () => void,
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
}

function MenuPopupElement({popupLrMode, keyboardOperation, closePopup, children}: MenuPopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);
    const popupDrawer = useContext(PopupDrawerContext);

    const [parent, setParent] = useState<HTMLElement | null>(null);
    const setPopupParent = useCallback((elem: HTMLElement | null) => setParent(elem && elem.parentElement), []);

    const [popupPos] = usePopupPos(popupElement, popupLrMode, parent);

    const isVisible = parent?.matches(VISIBLE_CHILD_SELECTOR);

    const { ctxToPath } = useSender();

    const hasIcon = children ? children.some(hasIconProp) : false;

    useEffect(() => {
        if (popupPos.visibility !== 'hidden' && keyboardOperation.current) {
            focusFirstMenuItem(popupElement, ctxToPath, children);
            keyboardOperation.current = false;
        }
        return () => {
            if (popupPos.visibility !== 'hidden') keyboardOperation.current = false;
        }
    }, [popupPos.visibility]);

    function closeOnBlur(e: FocusEvent) {
        if (!e.relatedTarget || elementsContainTarget([popupElement, parent], e.relatedTarget)) return;
        closePopup();
	}
    useAddEventListener(popupElement?.ownerDocument, 'focusout', closeOnBlur);

    const popup = (
        <div ref={setPopupElement}
            className={clsx('menuPopupBox popupEl', hasIcon && 'hasIcons')}
            style={popupPos}
            onClick={(e) => e.stopPropagation()} >
            {children}
        </div>
    );

    return (
        <PopupDrawerContext.Provider value={popupElement} >
            {isVisible && popupDrawer && createPortal(popup, popupDrawer)}
            <span ref={setPopupParent} style={{display: 'none'}}></span>
        </PopupDrawerContext.Provider>
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
	identity?: Identity,
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
	identity: Identity,
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