import React, { createContext, ReactElement, useContext, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { usePath } from "../main/vdom-hooks";
import { useClickSync, useClickSyncOpt } from "./exchange/click-sync";
import { ImageElement } from "../main/image";
import { identityAt } from "../main/vdom-util";
import { useFocusControl } from "./focus-control";
import { ARROW_DOWN_KEY, ARROW_LEFT_KEY, ARROW_RIGHT_KEY, ARROW_UP_KEY, ENTER_KEY } from "../main/keyboard-keys";
import { PopupWrapperKeyContext } from "./popup-elements/popup-contexts";
import { usePopupState } from "./popup-elements/popup-manager";
import { useChange } from "./custom-hooks";
import { focusAuto } from "./focus-announcer";

const receiverIdOf = identityAt('receiver');

interface MenuListCtx {
    activeId?: string,
    isActivated?: boolean,
    setActiveId: (id: string) => void,
    rootPopupKey: string
}

const MenuListCtx = createContext<MenuListCtx>({ setActiveId: () => undefined, rootPopupKey: '' });
MenuListCtx.displayName = "MenuListCtx";

interface MenuListProps {
    identity: object,
    children?: ReactElement<MenuItemProps>[]
}

interface MenuListNode {
    id: string,
    identity: object
}

function MenuList({ identity, children }: MenuListProps) {
    const nodes: MenuListNode[] = useMemo(() => (children || []).map((chl) => (
        { id: chl.props.id, identity: chl.props.identity }
    )), [children]);
    const ids = useMemo(() => nodes.map(n => n.id), [nodes]);

    const [activeId, setActiveId] = useState<string | undefined>(ids[0]);

    const activeNode = nodes?.find((node) => node.id === activeId);
    const { clicked: isActivated, onClick: activateActiveItem } = useClickSyncOpt(receiverIdOf(activeNode?.identity), !!activeNode);

    const path = usePath(identity);
    const { focusClass, focusHtml } = useFocusControl(path);

    const hasIcons = children?.some((item) => item.props.iconPath !== undefined);

    const ref = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        // timeout to let popup become visible
        const timeoutId = setTimeout(() => focusAuto(ref.current));
        return () => clearTimeout(timeoutId);
    }, []);

    const rootPopupKey = useContext(PopupWrapperKeyContext);

    function onKeyDown(e: React.KeyboardEvent) {
        switch (e.key) {
            case ARROW_UP_KEY:
            case ARROW_DOWN_KEY:
                e.stopPropagation();
                e.preventDefault();
                setActiveId(getNextId(ids, activeId, e.key === ARROW_UP_KEY ? 'up' : 'down'));
                break;
            case ARROW_LEFT_KEY:
            case ARROW_RIGHT_KEY:
                e.stopPropagation();
                break;
            case ENTER_KEY:
                e.stopPropagation();
                e.preventDefault();
                activateActiveItem?.();
                break;
            default:
                return;
        }
    }

    const menuListCtxValue = useMemo(() => (
        { activeId, isActivated, setActiveId, rootPopupKey }
    ), [activeId, isActivated, rootPopupKey]);

    return (
        <div
            ref={ref}
            {...focusHtml}
            className={clsx("menuListBox", focusClass, hasIcons && 'hasIcons')}
            onKeyDown={onKeyDown}
        >
            <MenuListCtx.Provider value={menuListCtxValue}>
                {children}
            </MenuListCtx.Provider>
        </div>
    );
}

interface MenuItemProps {
    identity: object,
    id: string,
    name: string,
    iconPath?: string
}

function MenuListItem({ identity, id, name, iconPath }: MenuItemProps) {
    const { clicked, onClick } = useClickSync(receiverIdOf(identity));

    const { activeId, isActivated, setActiveId, rootPopupKey } = useContext(MenuListCtx);
    const isActive = id === activeId;
    const isActivatedByKey = isActive && !!isActivated;

    const { toggle } = usePopupState(rootPopupKey);
    const onAfterClick = (curr: boolean, prev: boolean) => {
        if (prev && !curr) toggle(false)
    }
    useChange(clicked, onAfterClick);
    useChange(isActivatedByKey, onAfterClick);

    return (
        <button
            className={clsx('menuListItem', isActive && 'isActive')}
            style={{ ...(clicked || isActivatedByKey) && { opacity: "0.4", cursor: 'default' }}}
            onClick={onClick}
            onMouseEnter={() => setActiveId(id)}
        >
            {iconPath && <ImageElement src={iconPath} className='textLineSize' color='adaptive' />}
            <span className='text'>{name}</span>
        </button>
    );
}

const getNextId = (ids: string[], current: string | undefined, dir: 'up' | 'down' = 'down') => {
    const length = ids.length;
    if (length === 0) return undefined;
    const currIndex = ids.findIndex((id) => id === current);
    if (currIndex < 0) return ids[0];
    const nextInd = dir === 'up'
        ? (currIndex - 1 + length) % length
        : (currIndex + 1) % length;
    return ids[nextInd];
}

export { MenuList, MenuListItem }