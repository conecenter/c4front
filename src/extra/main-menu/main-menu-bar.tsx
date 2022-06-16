import React, {createContext, ReactElement, useCallback, useContext, useEffect, useRef} from "react";
import clsx from 'clsx';
import {Expander, ExpanderArea} from '../../main/expander-area';
import {useInputSync} from '../exchange/input-sync';
import {getNextArrayIndex, handleMenuBlur, patchToState, stateToPatch} from './main-menu-utils';
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
import { PathContext, useFocusControl } from "../focus-control";
import { ARROW_DOWN_KEY, ARROW_UP_KEY, ENTER_KEY, ESCAPE_KEY, KEY_TO_DIRECTION, M_KEY } from "../../main/keyboard-keys";

const DATA_PATH = 'main-menu-bar';
const KEY_MODIFICATOR = { ArrowLeft: -1, ArrowRight: 1 };

type onArrowKey = (path: string, elem: HTMLElement, key: 'ArrowLeft' | 'ArrowRight') => void;

const MenuControlsContext = createContext<onArrowKey | null>(null);

const isMenuFolderType = (item: ReactElement) => item.type === MenuFolderItem || item.type === MenuUserItem;


interface BurgerMenu {
  opened: boolean,
  domRef: React.RefObject<HTMLDivElement>,
  setFinalState: (s: MenuItemState) => void,
  children: ReactElement<MenuItem>[]
}

const BurgerMenu = ({opened, domRef, setFinalState, children}: BurgerMenu) => {
  const { focusClass, focusHtml } = useFocusControl('burgerMenu');

  const currentPath = useContext(PathContext);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch(e.key) {
      case ENTER_KEY:
        if (!opened) {
            setFinalState({ opened: true });
            e.stopPropagation();
            const pathToFocus = children && children[0].props.path;
            setTimeout(() => {
                if (pathToFocus && domRef.current) {
                    const itemToFocus: HTMLElement | null = domRef.current.querySelector(`[data-path='${pathToFocus}']`);
                    itemToFocus?.focus();
                }
            });
        }                
        break;
      case ESCAPE_KEY:
        if (opened) {
            e.currentTarget.focus();
            setFinalState({ opened: false });
        } 
        break;
      case ARROW_DOWN_KEY:
      case ARROW_UP_KEY:
        if (!opened) break;
        const focusedIndex = children.findIndex(child => child.props.path === currentPath);
        if (focusedIndex === -1) break;
        const nextFocusedIndex = getNextArrayIndex(children.length, focusedIndex, KEY_TO_DIRECTION[e.key]);
        if (nextFocusedIndex === undefined) break;
        const pathToFocus = children[nextFocusedIndex].props.path;
        if (pathToFocus && domRef.current) {
          const itemToFocus: HTMLElement | null = domRef.current.querySelector(`[data-path='${pathToFocus}']`);
          itemToFocus && itemToFocus.focus();
        }
        e.preventDefault();
        e.stopPropagation();
    }
};

  return (
    <div className={clsx(focusClass, 'menuBurgerBox')} 
         onBlur={(e) => handleMenuBlur(e, setFinalState)}
         onKeyDown={handleKeyDown}
         {...focusHtml}
         ref={domRef} >
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
};


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

  const domRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const doc =  domRef.current?.ownerDocument;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.altKey) && e.key === M_KEY) {
        setFinalState({ opened: true });
        // focus first top-level item
        const firstFocusablePath = leftChildren[0].props.path;
        const firstFocusableItem: HTMLElement | null = doc!.querySelector(`[data-path='${firstFocusablePath}']:not([style*="visibility: hidden"] *)`);
        firstFocusableItem?.click();
        firstFocusableItem?.focus();
      }
    }
    if (doc) {
      const window = doc.defaultView;
      window?.addEventListener("keydown", onKeyDown);
      return () => window?.removeEventListener("keydown", onKeyDown);
    }
  }, []);
  
  const onArrowKey: onArrowKey = useCallback((path, elem, key) => {
    const menuItems = [...leftChildren, ...(rightChildren || [])];
    const doc =  elem.ownerDocument;
    const openedMenuFolderIndex = menuItems.findIndex(child => child.props.path === path);
    if (openedMenuFolderIndex === -1 || !doc) return;
    const nextMenuItemIndex = openedMenuFolderIndex + KEY_MODIFICATOR[key];
    if (nextMenuItemIndex < 0 || nextMenuItemIndex >= menuItems.length) return;
    const nextFocusablePath = menuItems[nextMenuItemIndex].props.path;
    const selector = `[data-path='${nextFocusablePath}']:not([style*="visibility: hidden"] *)`;
    const nextFocusableItem: HTMLElement | null = doc.querySelector(selector);
    nextFocusableItem?.focus();
    if (isMenuFolderType(menuItems[nextMenuItemIndex])) nextFocusableItem?.click();
  }, []);

  return (
    <MenuControlsContext.Provider value={onArrowKey}>
      <ExpanderArea key='top-bar' 
                    maxLineCount={1}
                    props={{ 
                      className: clsx('mainMenuBar topRow', !hasOpened && 'hideOnScroll'),
                      style: { top: scrollPos.elementsStyles.get(DATA_PATH) },
                      'data-path': DATA_PATH,
                      //onKeyDown: handleKeyDown
                    }}
                    expandTo={[
        <Expander key='left-menu-compressed' area="lt" expandOrder={1} expandTo={leftMenuExpanded}>
          <BurgerMenu opened={opened} setFinalState={setFinalState} children={leftChildren} domRef={domRef}/>
        </Expander>,

        <Expander key='right-menu-compressed'
                  className='rightMenuBox rightMenuCompressed'
                  area="rt"
                  expandOrder={0}
                  expandTo={rightMenuExpanded}>
          {rightMenuCompressed}
        </Expander>
      ]}/>
    </MenuControlsContext.Provider>
  );
};

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

export {MainMenuBar, MenuFolderItem, MenuControlsContext};
export type {MenuItemState};

export const mainMenuComponents = {MainMenuBar, MenuFolderItem, MenuExecutableItem, MenuCustomItem, MenuItemsGroup, MenuUserItem, MainMenuClock}
