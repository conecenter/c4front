import React, {ReactElement} from "react";
import clsx from 'clsx';
import {Expander, ExpanderArea} from '../../main/expander-area';
import {useInputSync} from '../input-sync';
import {handleMenuBlur, patchToState, stateToPatch} from './main-menu-utils';
import {MainMenuClock} from './main-menu-clock';
import {
  MenuCustomItem,
  MenuExecutableItem,
  MenuFolderItem,
  MenuItem, MenuItemsGroup,
  MenuPopupElement,
  MenuUserItem
} from './main-menu-items';


interface MainMenuBar {
  key: string,
  identity: Object,
  state: MenuItemState,
  hasOpened?: boolean,
  icon?: string    
  leftChildren: ReactElement<MenuItem>[],
  rightChildren?: ReactElement<MenuItem>[]
}

interface MenuItemState {
  opened: boolean
}

function MainMenuBar({identity, state, hasOpened, icon, leftChildren, rightChildren}: MainMenuBar) {
  const {
    currentState: {opened},
    setFinalState
  } = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);

  // Left part of main menu
  const leftMenuWithLogo = !icon ? undefined : (
    <Expander key='left-menu-with-logo' className='leftMenuBox' area="lt">
      <div className='menuCustomItem menuLogo'>
        <img src={icon} alt='menu-logo'/>
      </div>
      {leftChildren}
    </Expander>
  );

  const leftMenuWithIcons = (
    <Expander key='left-menu-with-icons' className='leftMenuBox' area="lt" expandTo={leftMenuWithLogo}>
      {leftChildren}
    </Expander>
  );

  const leftMenuExpanded = (
    <Expander key='left-menu-expanded'
              className='leftMenuBox hiddenIcons'
              area="lt"
              expandOrder={3}
              expandTo={leftMenuWithIcons}>
      {leftChildren}
    </Expander>
  );

	// Right part of main menu
	const rightMenuCompressed = rightChildren ? getRightMenuCompressed(rightChildren) : null;

  const rightMenuExpanded = (
    <Expander key='right-menu-reduced' className='rightMenuBox rightMenuCompressed' expandOrder={2} area='rt' expandTo={
      <Expander key='right-menu-expanded' className='rightMenuBox' area='rt'>
        {rightChildren}
      </Expander>
    }>
      {rightChildren}
    </Expander>
  );

  return (
    <ExpanderArea key='top-bar' className={clsx('mainMenuBar topRow', hasOpened && 'hideOnScroll')} maxLineCount={1} expandTo={[
      <Expander key='left-menu-compressed' area="lt" expandOrder={1} expandTo={leftMenuExpanded}>
        <BurgerMenu opened={opened} setFinalState={setFinalState} children={leftChildren}/>
      </Expander>,

      <Expander key='right-menu-compressed'
                className='rightMenuBox rightMenuCompressed'
                area="rt"
                expandOrder={0}
                expandTo={rightMenuExpanded}>
        {rightMenuCompressed}
      </Expander>
    ]}/>
  );
}

function getRightMenuCompressed(rightChildren: ReactElement<MenuItem>[]) {
  const menuUserItem = rightChildren.find(child => child.type === MenuUserItem) as ReactElement<MenuUserItem> | undefined;
  if (!menuUserItem) return null;
  const rightChildrenFiltered = rightChildren
      .filter((child: JSX.Element) => ![MenuUserItem, MainMenuClock].includes(child.type));
  return React.cloneElement(menuUserItem, {}, React.Children.toArray(menuUserItem.props.children).concat(rightChildrenFiltered));
}


interface BurgerMenu {
  opened: boolean,
  setFinalState: (s: MenuItemState) => void,
  children: ReactElement<MenuItem>[]
}

function BurgerMenu({opened, setFinalState, children}: BurgerMenu) {
  return (
    <div className='menuBurgerBox' onBlur={(e) => handleMenuBlur(e, setFinalState)}>
      <button key='left-menu'
              className='btnBurger'
              onClick={() => setFinalState({opened: !opened})} >
        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1"
             viewBox="0 0 32 32">
          <line strokeLinecap="round" x1="2" x2="30" strokeWidth="4"
                y1={opened ? '16' : '9'}
                y2={opened ? '16' : '9'}
                style={opened ? {transform: "rotate(-45deg)"} : {}}/>
          <line strokeLinecap="round" x1="2" y1="17" x2="30" y2="17" strokeWidth="4"
                style={opened ? {opacity: "0"} : {}}/>
          <line strokeLinecap="round" x1="2" x2="30" strokeWidth="4"
                y1={opened ? '16' : '25'}
                y2={opened ? '16' : '25'}
                style={opened ? {transform: "rotate(45deg)"} : {}}/>
        </svg>
      </button>

      {opened &&
          <MenuPopupElement popupLrMode={false} children={children}/>}
    </div>
  );
}

export {MainMenuBar, MenuFolderItem};
export type {MenuItemState};

export const mainMenuComponents = {MainMenuBar, MenuFolderItem, MenuExecutableItem, MenuCustomItem, MenuItemsGroup, MenuUserItem, MainMenuClock}
