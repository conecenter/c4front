import React, { useState, ReactElement, ReactNode, useRef, useEffect } from "react";
import clsx from 'clsx';
import { Expander, ExpanderArea } from '../main/expander-area';
import { usePopupPos } from '../main/popup';
import { Patch, PatchHeaders, useInputSync } from './input-sync';

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
    opened: boolean
}

type MenuItem = MenuFolderItem | MenuExecutableItem | MenuCustomItem;

interface MenuFolderItem {
    key: string,
	identity: Object,
    name: string,
    current: boolean,
    state: MenuItemState,
    icon?: string,
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
}

interface MenuExecutableItem {
    key: string,
	identity: Object,
    name: string,
    current: boolean,
    state: MenuItemState,
    icon?: string
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
    popupLrMode: boolean,
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
}

function MainMenuBar({ leftChildren }: MainMenuBar) {   
    return (
			<div key='top-bar' className='mainMenuBar top-row hide-on-scroll'>
					<ExpanderArea maxLineCount={1} expandTo={[
                        <Expander key='left-menu' area="lt" expandOrder={1} expandTo={[
                            <Expander area="lt">
                                <div className='leftMenuBox'>
                                    {leftChildren}
                                </div>
                            </Expander>
                        ]}>
                            <button key='left-menu' className='btnBurger' />
                        </Expander>,
                        <Expander key='right-menu' area="rt" expandOrder={0} expandTo={[
                            <Expander key='right-menu-expanded' area='rt'>
                                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                                    <div>Hello world!</div>
                                    <div>Hello world!</div>
                                    <div>Hello world!</div>
                                    <div>Hello world!</div>
                                </div>
                            </Expander>
                        ]}>
                            <div>Hello world!</div>
                        </Expander>
                    ]} />
			</div>            
    );
}

function MenuFolderItem({identity, name, state, icon, children}: MenuFolderItem) {
    const {
        currentState, 
        setFinalState
    } = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);
    const {opened} = currentState;

    const [popupLrMode, setPopupLrMode] = useState(false);

    const menuFolderRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (isPopupChild(menuFolderRef.current)) setPopupLrMode(true);
    });

    function handleBlur(e: React.FocusEvent) {
		if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
		setFinalState({ opened: false });
	}

    return (
        <div 
            ref={menuFolderRef}
            className={clsx('menuItem', !icon && 'noIcon', opened && 'menuFolderOpened')} 
            tabIndex={1}
            onBlur={handleBlur}
            onClick={() => setFinalState({ opened: !currentState.opened })}
        >
            {icon && <img src={icon} className='rowIconSize' />}
            <span>{name}</span>
            <img 
                src='..\datepicker\arrow-down.svg' 
                className='menuFolderIcon'
                alt='arrow-down-icon' />

            {opened &&
                <MenuPopupElement popupLrMode={popupLrMode}>{children}</MenuPopupElement>}
        </div>
    );
}

function MenuExecutableItem({identity, name, state, icon}: MenuExecutableItem) {
    const {
        currentState, 
        setFinalState
    } = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);

    return (
        <div 
            className={clsx('menuItem', !icon && 'noIcon')} 
            tabIndex={1} 
            onClick={() => setFinalState({ opened: true })}
        >
            {icon && <img src={icon} className='rowIconSize'/>}
            <span>{name}</span>
        </div>
    );
}

function MenuPopupElement({popupLrMode, children}: MenuPopupElement) {
    const [popupElement,setPopupElement] = useState<HTMLDivElement | null>(null);
    const [popupPos] = usePopupPos(popupElement, popupLrMode);

    return (
        <div 
            ref={setPopupElement} 
            className='menuPopupBox popupEl' 
            style={popupPos} 
            onClick={(e) => e.stopPropagation()}>
            {children}
        </div>
    );
}

function MenuItemsGroup({children}: MenuItemsGroup) {
    return (
        <>
            <hr/>{children}<hr/>
        </>
    );
}

/*
 * Server sync functionality
*/
function isPopupChild(element: HTMLElement | null) {
    const parent = element && element.parentElement;
    return parent && parent.classList.contains('popupEl');
}

function patchToState(patch: Patch): MenuItemState {
    const headers = patch.headers as PatchHeaders;
	return { opened: !!headers['x-r-opened'] };
}

function stateToPatch({ opened }: MenuItemState): Patch {
	const headers = { 'x-r-opened': opened ? '1' : '' };
	return { value: '', headers };
}

export { MainMenuBar, MenuFolderItem, MenuExecutableItem, MenuItemsGroup };