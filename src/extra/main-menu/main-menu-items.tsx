import React from 'react';
import clsx from 'clsx';
import { useClickSync } from '../exchange/click-sync';
import { useFocusControl } from '../focus-control';
import { MenuItem } from './main-menu-bar';
import { ENTER_KEY } from '../../main/keyboard-keys';
import { MenuFolderItem } from './menu-folder-item';
import { BindingElement } from '../binds/binds-elements';
import { useBinds } from '../binds/key-binding';
import { SVGElement } from '../../main/image';
import { identityAt } from '../../main/vdom-util';
import { MenuCustomItemProps, MenuExecutableItemProps, MenuItemsGroupProps, MenuUserItemProps } from 'types/c4gen.MainMenuApi';

const receiverIdOf = identityAt('receiver');

function MenuExecutableItem({identity, name, current, path, icon, bindSrcId}: MenuExecutableItemProps) {
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

function MenuCustomItem({path, children}: MenuCustomItemProps) {
    const { focusClass, focusHtml } = useFocusControl(path);

    return (
        <div className={clsx(focusClass, 'menuCustomItem')} {...focusHtml} >
            {children}
        </div>
    );
}


function MenuItemsGroup({children}: Omit<MenuItemsGroupProps, 'identity'>) {
    return (
        <>
            <hr/>{children}<hr/>
        </>
    );
}


const MenuUserItem = (props: MenuUserItemProps) => (
    <MenuFolderItem {...props} key={'mi-user-item'} shortName={props.shortName} name={props.longName} />
);


export { MenuExecutableItem, MenuCustomItem, MenuItemsGroup, MenuUserItem };
export type { MenuItem };