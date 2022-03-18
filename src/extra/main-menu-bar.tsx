import React, { useState, ReactElement, useCallback, ReactNode } from "react";
import clsx from 'clsx';
import { Expander, ExpanderArea } from '../main/expander-area';
import { usePopupPos } from '../main/popup';
import { useSync } from '../main/vdom-hooks';
import { identityAt } from '../main/vdom-util';

interface MainMenuBar {
    key: string,
	identity: Object,
    leftChildren: ReactElement<MenuItem>[],
    centralChildren?: MenuItem[],
    rightChildren?: MenuItem[],
    state: MenuItemState,
    icon?: string    
}

interface MenuItemState {
    opened: boolean,
    current?: boolean
}

type MenuItem = MenuFolderItem | MenuExecutableItem | MenuCustomItem;

interface MenuFolderItem {
    key: string,
	identity: Object,
    name: string,
    icon: string,
    children?: ReactElement<MenuItem | MenuItemsGroup>[],
    state: MenuItemState
}

interface MenuExecutableItem {
    key: string,
	identity: Object,
    name: string,
    state: MenuItemState,
    icon: string
}

interface MenuCustomItem {
    key: string,
	identity: Object,
    children: ReactNode[],
    clickable?: boolean // обрабатывать клики?
}

interface MenuItemsGroup {
    key: string,
	identity: Object,
    children: ReactElement<MenuItem>[]
}

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

function MenuFolderItem({identity, name, state, icon, children}: MenuFolderItem) {
    const {currentState, setFinalState} = useMenuItemSync(identity, 'receiver', state);
    const { opened, current } = currentState;

    function handleBlur(e: React.FocusEvent) {
		if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
		setFinalState({ opened: false, current });
	}

    return (
        <div 
            className={clsx('menuItem', !icon && 'noIcon')} 
            tabIndex={1}
            onBlur={handleBlur}
            onClick={() => setFinalState({ opened: !currentState.opened, current })}>
            {icon && <img src={icon} className='rowIconSize' />}
            <span>{name}</span>
            <img src='..\datepicker\arrow-down.svg' className='menuFolderIcon' alt='arrow-down-icon' />
            {opened &&
                <MenuPopupElement>{children}</MenuPopupElement>}
        </div>
    );
}

function MenuExecutableItem({identity, name, state, icon}: MenuExecutableItem) {
    const {currentState, setFinalState} = useMenuItemSync(identity, 'receiver', state);
    const { opened, current } = currentState;
    return (
        <div className={clsx('menuItem', !icon && 'noIcon')} tabIndex={1} onClick={() => setFinalState({ opened: !currentState.opened, current })}>
            {icon && <img src={icon} className='rowIconSize'/>}
            <span>{name}</span>
        </div>
    );
}

function MenuPopupElement({children}: MenuPopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);
    const [popupPos] = usePopupPos(popupElement);
    return (
        <div ref={setPopupElement} className='menuPopupBox popupEl' style={popupPos} onClick={(e) => e.stopPropagation()}>
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

const receiverId = (name: string) => identityAt(name);

function useMenuItemSync(
    identity: Object,
    receiverName: string,
    serverState: MenuItemState,
) {
    const [patches, enqueuePatch] = useSync(receiverId(receiverName)(identity)) as [Patch[], (patch: Patch) => void];
    const patch: Patch = patches.slice(-1)[0];
    const currentState: MenuItemState = patch ? patchToState(patch) : serverState;
    const setFinalState = useCallback((state: MenuItemState) => enqueuePatch(stateToPatch(state)), [enqueuePatch]);
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

export { MainMenuBar, MenuFolderItem, MenuExecutableItem };