import React, { ReactElement } from "react";
import { Expander, ExpanderArea } from '../../main/expander-area';
import { useInputSync } from '../input-sync';
import { handleMenuBlur, patchToState, stateToPatch } from './main-menu-utils';
import {
    MenuCustomItem,
    MenuExecutableItem,
    MenuFolderItem,
    MenuItem,
    MenuItemsGroup,
    MenuPopupElement
} from './main-menu-items';

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

function MainMenuBar({ identity, state, icon, leftChildren, rightChildren }: MainMenuBar) {
    const {
        currentState: { opened }, 
        setFinalState
    } = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);

    const leftMenuWithLogo = !icon ? undefined : (
            <Expander key='left-menu-logo' className='leftMenuBox' area="lt">
                <div className='menuItem'>
                    <img className='menuLogo' src={icon} alt='menu-logo'/>    
                </div>                   
                {leftChildren}
            </Expander>
    );

    return (
        <ExpanderArea key='top-bar' className='mainMenuBar topRow hideOnScroll' maxLineCount={1} expandTo={[
            <Expander key='left-menu' area="lt" expandOrder={0} expandTo={
                <Expander key='left-menu-expanded' className='leftMenuBox' area="lt" expandTo={leftMenuWithLogo}>
                    {leftChildren}
                </Expander>
            }>
                <BurgerMenu opened={opened} setFinalState={setFinalState}>
                    {leftChildren}
                </BurgerMenu>
            </Expander>,
            
            <Expander key='right-menu' area="rt" expandOrder={1} expandTo={
                <Expander key='right-menu-expanded' className='rightMenuBox' area='rt'>
                    {rightChildren}
                </Expander>
            }>
                <MenuFolderItem
                    key='menuFolderItem-21' 
                    identity={{parent: 'mainMenuBar'}} 
                    name='DEV' 
                    current={false} 
                    state={{ opened: false }}
                    children={rightChildren} />
            </Expander>
        ]} />          
    );
}

interface BurgerMenu {
    opened: boolean,
    setFinalState: (s: MenuItemState) => void,
    children: ReactElement<MenuItem>[]
}

function BurgerMenu({ opened, setFinalState, children }: BurgerMenu) {
    return (
        <div className='menuBurgerBox' onBlur={(e) => handleMenuBlur(e, setFinalState)} >
            <button 
                key='left-menu' 
                className='btnBurger' 
                onClick={() => setFinalState({opened: !opened})} 
            >
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

            {opened && 
                <MenuPopupElement popupLrMode={false} children={children} />}
        </div>
    );
}

export { MainMenuBar, MenuFolderItem };
export type { MenuItemState };

export const mainMenuComponents = {MainMenuBar, MenuFolderItem, MenuExecutableItem, MenuCustomItem, MenuItemsGroup}