import React, { useState, ReactElement, useCallback } from "react";
import { Expander, ExpanderArea } from '../main/expander-area';
import { usePopupPos } from '../main/popup';
import { useSync } from '../main/vdom-hooks';

interface MainMenuBar {
    key: string,
	identity: Object,
    leftChildren: ReactElement<MenuItem>[],
    centralChildren?: MenuItem[],
    rightChildren?: MenuItem[],
    icon?: string
}

type MenuItem = MenuFolderItem | MenuExecutableItem // | MenuCustomItem;

interface MenuFolderItem {
    key: string,
	identity: Object,
    name: string,
    opened: boolean,
    current: boolean,
    icon: string,
    children?: ReactElement<MenuItem | MenuItemsGroup>[],
}

interface MenuExecutableItem {
    key: string,
	identity: Object,
    name: string,
    opened: boolean,
    current: boolean,
    icon: string
}

interface MenuItemsGroup {
    key: string,
	identity: Object,
    current: boolean,
    children: ReactElement<MenuItem>[]
}

type MenuCustomItem = any;

interface MenuPopupElement {
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
}

function MainMenuBar({ leftChildren }: MainMenuBar) {   
    return (
			<div key='top-bar' className='mainMenuBar top-row hide-on-scroll'>
					<ExpanderArea maxLineCount={1} expandTo={[
                        <Expander key='left-menu' area="lt" expandOrder={0} expandTo={[
                            <Expander area="lt">
                                <div className='leftMenuBox'>
                                    {leftChildren}
                                </div>
                            </Expander>
                        ]}>
                            <button key='left-menu' className='btnBurger' />
                        </Expander>,
                        <Expander key='right-menu' area="rt" expandOrder={1}>
                            <div>Hello world!</div>
                            <div>Hello world!</div>
                            <div>Hello world!</div>
                            <div>Hello world!</div>
                        </Expander>
                    ]} />
			</div>            
    );
}

function MenuFolderItem({name, icon, children}: MenuFolderItem) {
    const [popupOpen, setPopupOpen] = useState(false);
    return (
        <div className='menuItem' tabIndex={1} onClick={() => setPopupOpen(!popupOpen)}>
            {icon && <img src={icon} />}
            <span>{name}</span>
            <img src='..\test\datepicker\arrow-down.svg' className='menuFolderIcon' alt='arrow-down-icon' />
            {popupOpen &&
                <MenuPopupElement>{children}</MenuPopupElement>}
        </div>
    );
}

function MenuPopupElement({children}: MenuPopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);
    const [popupPos] = usePopupPos(popupElement);
    return (
        <div ref={setPopupElement} className='menuPopupBox popupEl' style={popupPos} >
            {children}
        </div>
    );
}


interface Patch {
    headers: PatchHeaders,
    skipByPath: boolean,
    retry: boolean,
    defer: boolean
}

interface PatchHeaders {
    'x-r-opened': string,
    'x-r-current': string
}

interface MenuItemState {
    opened: boolean,
    current: boolean
}

function useMenuItemSync(
    identity: Object,
    receiverName: string,
    serverState: MenuItemState,
    patchToState: (p: Patch) => MenuItemState,
    serverToState: (s: MenuItemState) => MenuItemState,
    stateToPatch: (s: MenuItemState) => Patch
) {
    const [patches, enqueuePatch] = useSync(receiverId(receiverName)(identity));
    const patch: Patch = patches.slice(-1)[0];
    const currentState: MenuItemState = patch ? patchToState(patch) : serverState;
    const setFinalState = useCallback((state: MenuItemState) => enqueuePatch(stateToPatch(state), [enqueuePatch]));
    return { currentState, setFinalState };
}

function patchToState({ headers }: Patch): MenuItemState {
	return {
		opened: !!headers['x-r-opened'],
        current: !!headers['x-r-current']
	};
}

function stateToPatch({opened, current}: MenuItemState): Patch {
	const headers = {
		'x-r-opened': opened ? '1' : '',
        'x-r-current': current ? '1' : ''
	};
	return { headers, skipByPath: true, retry: true, defer: false };
}

export { MainMenuBar, MenuFolderItem };