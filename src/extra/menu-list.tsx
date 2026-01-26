import React, { ReactElement } from "react";
import clsx from "clsx";
import { ButtonElement } from "./button-element";
import { usePath } from "../main/vdom-hooks";
import { useClickSync } from "./exchange/click-sync";
import { ImageElement } from "../main/image";
import { identityAt } from "../main/vdom-util";

const receiverIdOf = identityAt('receiver');

interface MenuListProps {
    children?: ReactElement<MenuItemProps>[]
}

function MenuList({ children }: MenuListProps) {
    const hasIcons = children?.some((item) => item.props.iconPath !== undefined);
    return (
        <div className={clsx("menuListBox", hasIcons && 'hasIcons')}>
            {children}
        </div>
    );
}

interface MenuItemProps {
    identity: object,
    name: string,
    iconPath?: string
}

function MenuListItem({ identity, name, iconPath }: MenuItemProps) {
    const { clicked, onClick } = useClickSync(receiverIdOf(identity));
    return (
        <ButtonElement
            value={clicked}
            className='menuListItem'
            onClick={onClick}
        >
            {iconPath && <ImageElement src={iconPath} className='textLineSize' color='adaptive' />}
            <span className='text'>{name}</span>
        </ButtonElement>
    );
}

export { MenuList, MenuListItem }