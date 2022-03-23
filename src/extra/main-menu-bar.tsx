import React, { useState, ReactElement, ReactNode, useRef, useEffect } from "react";
import clsx from 'clsx';
import { Expander, ExpanderArea } from '../main/expander-area';
import { usePopupPos } from '../main/popup';
import { Patch, PatchHeaders, useInputSync } from './input-sync';

interface MainMenuBar {
    key: string,
	identity: Object,
    state: MenuItemState,
    icon?: string    
    leftChildren: ReactElement<MenuItem>[],
    rightChildren?: ReactElement<MenuItem>[],
    rightChildrenFolder?: ReactElement<MenuFolderItem>
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
    children?: ReactNode[]
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

interface BurgerButton {
    opened: boolean,
    handleClick: () => void
}

function MainMenuBar({ identity, state, leftChildren, rightChildren }: MainMenuBar) {
    const {
        currentState, 
        setFinalState
    } = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);
    const {opened} = currentState;
    return (
        <ExpanderArea key='top-bar' className='mainMenuBar top-row hide-on-scroll' maxLineCount={1} expandTo={[
            <Expander key='left-menu' area="lt" expandOrder={1} expandTo={[
                <Expander key='left-menu-expanded' className='leftMenuBox' area="lt">
                    {leftChildren}
                </Expander>
            ]}>
                <div className='menuBurgerBox' onBlur={(e) => handleMenuBlur(e, setFinalState)} >
                    <BurgerButton opened={opened} handleClick={() => setFinalState({opened: !opened})} />
                    {opened && 
                        <MenuPopupElement popupLrMode={false} children={leftChildren} />}
                </div>
            </Expander>,
            <Expander key='right-menu' area="rt" expandOrder={0} expandTo={[
                <Expander key='right-menu-expanded' className='rightMenuBox' area='rt'>
                    {rightChildren}
                </Expander>
            ]}>
                <MenuFolderItem 
                    key='menuFolderItem-21' 
                    identity={{parent: 'mainMenuBar'}} 
                    name='DEV' 
                    current={false} 
                    state={{ opened: false }} />
            </Expander>
        ]} />          
    );
}

function BurgerButton({ opened, handleClick }: BurgerButton) {
    return (
        <button 
            key='left-menu' 
            className='btnBurger' 
            onClick={handleClick} >
            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 32 32">
                <line strokeLinecap="round" x1="2" x2="30" strokeWidth="4"
                    y1={opened ? '16' : '9'}                
                    y2={opened ? '16' : '9'}                
                    style={opened ? { transform: "rotate(-45deg)" } : {}} />
                <line strokeLinecap="round" x1="2" y1="17" x2="30" y2="17" strokeWidth="4" 
                    style={opened ? { opacity: "0" } : {}} />
                <line strokeLinecap="round" x1="2" x2="30" strokeWidth="4"
                    y1={opened ? '16' : '25'}
                    y2={opened ? '16' : '25'}                
                    style={opened ? { transform: "rotate(45deg)" } : {}} />
            </svg>
        </button>
    );
}

function MenuFolderItem({identity, name, current, state, icon, children}: MenuFolderItem) {
    const {
        currentState, 
        setFinalState
    } = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);
    const { opened } = currentState;

    const [popupLrMode, setPopupLrMode] = useState(false);

    const menuFolderRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (isPopupChild(menuFolderRef.current)) setPopupLrMode(true);
    });

    return (
        <div 
            ref={menuFolderRef}
            className={clsx('menuItem', !icon && 'noIcon', opened && 'menuFolderOpened', current && 'isCurrent')}
            tabIndex={1}
            onBlur={(e) => handleMenuBlur(e, setFinalState)}
            onClick={() => setFinalState({ opened: !opened })}
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

function MenuExecutableItem({identity, name, current, state, icon}: MenuExecutableItem) {
    const {
        currentState,
        setFinalState 
    } = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);
    const { opened } = currentState;
    
    return (
        <div 
            className={clsx('menuItem', !icon && 'noIcon', current && 'isCurrent', opened && 'executeAnim')}
            tabIndex={1} 
            onClick={() => setFinalState({ opened: true })}
        >
            {icon && <img src={icon} className='rowIconSize'/>}
            <span>{name}</span>
        </div>
    );
}

function MenuCustomItem({children}: MenuCustomItem) {
    return (
        <div className='menuItem'>
            {children}
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

function handleMenuBlur(e: React.FocusEvent, setFinalState: (s: MenuItemState) => void) {
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
    setFinalState({ opened: false });
}

function isPopupChild(element: HTMLElement | null) {
    const parent = element && element.parentElement;
    return parent && parent.classList.contains('popupEl');
}

// Server sync functionality

function patchToState(patch: Patch): MenuItemState {
    const headers = patch.headers as PatchHeaders;
	return { opened: !!headers['x-r-opened'] };
}

function stateToPatch({ opened }: MenuItemState): Patch {
	const headers = { 'x-r-opened': opened ? '1' : '' };
	return { value: '', headers };
}

export { MainMenuBar, MenuFolderItem, MenuExecutableItem, MenuCustomItem, MenuItemsGroup };