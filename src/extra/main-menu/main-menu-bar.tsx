import React, {ForwardedRef, ReactElement, useContext, useEffect, useState} from "react";
import clsx from 'clsx';
import {Expander, ExpanderArea} from '../../main/expander-area';
import {useInputSync} from '../exchange/input-sync';
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
import { ScrollInfoContext } from '../scroll-info-context';
import { M_KEY } from "../../main/keyboard-keys";

const DATA_PATH = 'main-menu-bar';


interface BurgerMenu {
  opened: boolean,
  setFinalState: (s: MenuItemState) => void,
  children: ReactElement<MenuItem>[]
}

const BurgerMenu = React.forwardRef(({opened, setFinalState, children}: BurgerMenu, domRef: ForwardedRef<HTMLDivElement>) => {
  return (
    <div ref={domRef} className='menuBurgerBox' onBlur={(e) => handleMenuBlur(e, setFinalState)}>
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
  )
});


interface MainMenuBar {
  key: string,
  identity: Object,
  state: MenuItemState,
  hasOpened?: boolean,
  icon?: string
  leftChildren: ReactElement<MenuItem>[],
  rightChildren?: ReactElement<MenuItem | MainMenuClock>[]
}

interface MenuItemState {
  opened: boolean
}

function MainMenuBar({identity, state, hasOpened, icon, leftChildren, rightChildren}: MainMenuBar) {
  const {
    currentState: {opened},
    setFinalState
  } = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);

  const domRef = React.useRef<HTMLInputElement>(null);

  const scrollPos = useContext(ScrollInfoContext);

  // Left part of menu
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

	// Right part of menu
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

  const [focusControl, setFocusControl] = useState(false);
  const [indexFocused, setIndexFocused] = useState(0);  // useRef??

  useEffect(() => {
    const doc =  domRef.current ? domRef.current.ownerDocument : null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!doc) return;
      if ((e.ctrlKey || e.altKey) && e.key === M_KEY) {
        // focus first top-level item
        const firstFocusablePath = leftChildren[indexFocused].props.path;
        const firstFocusableItems: NodeListOf<HTMLElement> = doc.querySelectorAll(`[data-path='${firstFocusablePath}']`);
        firstFocusableItems.forEach(item => item.focus());
        setFocusControl(true);
        // if (state.isBurger) openBurger(e)
      }
    }
    if (doc) {
      const window = doc.defaultView;
      window?.addEventListener("keydown", onKeyDown);
      return () => window?.removeEventListener("keydown", onKeyDown);
    }
  }, []); // ???

  function handleKeyDown(e: React.KeyboardEvent) {
    if (focusControl) {
      e.stopPropagation();
      let nextFocused;
      switch(e.key) {
        case 'ArrowRight':
          nextFocused = leftChildren.length <= indexFocused + 1 ? 0 : indexFocused + 1;
          break;
        case 'ArrowLeft':
          nextFocused = indexFocused === 0 ? leftChildren.length - 1 : indexFocused - 1;
      }
      if (nextFocused !== undefined) setIndexFocused(nextFocused);
    }
  }

  useEffect(() => {
    const doc =  domRef.current ? domRef.current.ownerDocument : null;
    if (doc) {
      const nextFocusablePath = leftChildren[indexFocused].props.path;
      const nextFocusableItems: NodeListOf<HTMLElement> = doc.querySelectorAll(`[data-path='${nextFocusablePath}']`);
      nextFocusableItems.forEach(item => item.focus());
    }
  }, [indexFocused])

  return (
    <ExpanderArea key='top-bar' 
                  maxLineCount={1}
                  props={{ 
                    className: clsx('mainMenuBar topRow', !hasOpened && 'hideOnScroll'),
                    style: { top: scrollPos.elementsStyles.get(DATA_PATH) },
                    'data-path': DATA_PATH,
                    onKeyDown: handleKeyDown
                  }}
                  expandTo={[
      <Expander key='left-menu-compressed' area="lt" expandOrder={1} expandTo={leftMenuExpanded}>
        <BurgerMenu ref={domRef} opened={opened} setFinalState={setFinalState} children={leftChildren}/>
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
  const rightChildrenGroup = (
    <MenuItemsGroup key=':right-children-compressed'>
      {rightChildrenFiltered}
    </MenuItemsGroup>
  );

  const menuUserChildren = React.Children.toArray(menuUserItem.props.children);
  const logOutIndex = menuUserChildren.findIndex(child => (child as React.ReactElement).props.name === 'Log out');
  const insertIndex = logOutIndex < 0 ? menuUserChildren.length : logOutIndex;
  menuUserChildren.splice(insertIndex, 0, rightChildrenGroup)

  return React.cloneElement(menuUserItem, {}, menuUserChildren);
}

export {MainMenuBar, MenuFolderItem};
export type {MenuItemState};

export const mainMenuComponents = {MainMenuBar, MenuFolderItem, MenuExecutableItem, MenuCustomItem, MenuItemsGroup, MenuUserItem, MainMenuClock}
