import React, {createContext, ReactElement, useCallback, useContext, useEffect, useRef, useState} from "react";
import clsx from 'clsx';
import {Expander, ExpanderArea} from '../../main/expander-area';
import {handleArrowUpDown, handleMenuBlur, patchToState, stateToPatch} from './main-menu-utils';
import {MainMenuClock} from './main-menu-clock';
import {ScrollInfoContext} from '../scroll-info-context';
import {useFocusControl} from "../focus-control";
import {ARROW_DOWN_KEY, ARROW_RIGHT_KEY, ARROW_UP_KEY, ENTER_KEY, ESCAPE_KEY, M_KEY} from "../../main/keyboard-keys";
import {MenuCustomItem, MenuExecutableItem, MenuItemsGroup, MenuPopupElement, MenuUserItem} from './main-menu-items';
import {MenuFolderItem} from "./menu-folder-item";
import {BindGroupElement} from "../binds/binds-elements";
import {NoCaptionContext, usePath} from "../../main/vdom-hooks";
import {isInstanceOfNode} from "../dom-utils";
import {VISIBLE_CHILD_SELECTOR} from "../css-selectors";
import {identityAt} from "../../main/vdom-util";
import {usePatchSync} from "../exchange/patch-sync";
import {PathContext} from "../focus-announcer";
import { SVGElement } from "../../main/image";

const MENU_BAR_PATH = 'main-menu-bar';
const KEY_MODIFICATOR = { ArrowLeft: -1, ArrowRight: 1 };

const receiverIdOf = identityAt('receiver');

const patchSyncTransformers = {
  serverToState: (s: MenuItemState) => s,
  changeToPatch: stateToPatch,
  patchToChange: patchToState,
  applyChange: (prev: MenuItemState, ch: MenuItemState) => ch
}

type OnArrowLeftRight = (path: string, elem: HTMLElement, key: 'ArrowLeft' | 'ArrowRight', isOpened: boolean) => void;

interface MenuControlsContext { 
  onArrowLeftRight?: OnArrowLeftRight, 
  setReadyArrowLeftRight?: () => boolean
}

const MenuControlsContext = createContext<MenuControlsContext>({});

const isMenuFolderType = (item: ReactElement) => item.type === MenuFolderItem || item.type === MenuUserItem;
const isMenuOpenCombo = (e: KeyboardEvent) => (e.ctrlKey || e.altKey) && e.key === M_KEY;


interface MainMenuBar {
  key: string,
  identity: object,
  state: MenuItemState,
  icon?: string
  leftChildren: ReactElement<MenuItem>[],
  rightChildren?: ReactElement<MenuItem | MainMenuClock>[]
}

type MenuItem = MenuFolderItem | MenuExecutableItem | MenuCustomItem | MenuUserItem;

interface MenuItemState {
  opened: boolean
}

function MainMenuBar({identity, state, icon, leftChildren, rightChildren}: MainMenuBar) {
  const {
    currentState: {opened},
    sendFinalChange: setFinalState
  } = usePatchSync(receiverIdOf(identity), state, false, patchSyncTransformers);

  const domRef = useRef<HTMLDivElement>(null);

  const currentPath = useContext(PathContext);
  const prevFocusedPath = useRef<string | null>(null);

  const scrollPos = useContext(ScrollInfoContext);

  // Left part of menu
  const leftMenuWithLogo = !icon ? undefined : (
    <Expander key='left-menu-with-logo' className='leftMenuBox' area="lt">
      <div className='menuCustomItem menuLogo'>
        <SVGElement url={icon} alt='menu-logo'/>
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

  // Open menu by keyboard combination
  useEffect(() => {
    const doc =  domRef.current?.ownerDocument;
    const window = doc?.defaultView;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isMenuOpenCombo(e)) {
        prevFocusedPath.current = currentPath;
        const isBurgerMenu = domRef.current?.matches(VISIBLE_CHILD_SELECTOR);
        if (isBurgerMenu) setFinalState({ opened: true });
        window!.scrollTo({top: 0});
        const firstFocusablePath = leftChildren[0].props.path;
        const pathSelector = `[data-path='${firstFocusablePath}']`;
        const firstFocusableItem: HTMLElement | null = isBurgerMenu 
            ? domRef.current!.querySelector(pathSelector)
            : doc!.querySelector(`${pathSelector}${VISIBLE_CHILD_SELECTOR}`);
        setTimeout(() => {
          firstFocusableItem?.focus();
          if (!isBurgerMenu) firstFocusableItem?.click();
        }, 10); // timeout until menu bar appears on screen
      }
    }
    if (window) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  });

  const [isFocused, setIsFocused] = useState(false);

  // Return focus on Esc after menu opening with keyboard combo
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === ESCAPE_KEY && prevFocusedPath.current) {
      const doc =  domRef.current!.ownerDocument;
      const returnFocusTo: HTMLElement | null = doc.querySelector(`[data-path='${prevFocusedPath.current}']`);
      returnFocusTo?.focus();
    }
  }

  function handleMenuBarBlur(e: React.FocusEvent) {
    if (isInstanceOfNode(e.relatedTarget) && e.currentTarget.contains(e.relatedTarget)) return;
    prevFocusedPath.current = null;
    setIsFocused(false);
  }
  
  // Handling menu items controls via ArrowLeft/ArrowRight
  const ready = useRef(true);
  const setReadyArrowLeftRight = useCallback(() => ready.current = true, []);
  const onArrowLeftRight: OnArrowLeftRight = useCallback((path, elem, key, isOpened) => {
    if (!ready.current) return;
    ready.current = false;
    const menuItems = [...leftChildren, ...(rightChildren || [])];
    const doc =  elem.ownerDocument;
    const openedMenuFolderIndex = menuItems.findIndex(child => child.props.path === path);
    if (openedMenuFolderIndex === -1 || !doc) return;
    const nextMenuItemIndex = openedMenuFolderIndex + KEY_MODIFICATOR[key];
    if (nextMenuItemIndex < 0 || nextMenuItemIndex >= menuItems.length) {
      ready.current = true;
      return;
    }
    const nextFocusablePath = menuItems[nextMenuItemIndex].props.path;
    const selector = `[data-path='${nextFocusablePath}']${VISIBLE_CHILD_SELECTOR}`;
    const nextFocusableItem: HTMLElement | null = doc.querySelector(selector);
    nextFocusableItem?.focus();
    if (isOpened && isMenuFolderType(menuItems[nextMenuItemIndex])) nextFocusableItem?.click();
    else ready.current = true;
  }, []);

  return (
    <BindGroupElement groupId='menubar' >
      <NoCaptionContext.Provider value={true} >
        <MenuControlsContext.Provider value={{onArrowLeftRight, setReadyArrowLeftRight}}>
          <ExpanderArea key='top-bar' 
                        maxLineCount={1}
                        props={{ 
                          className: clsx('mainMenuBar topRow', !isFocused && 'hideOnScroll'),
                          style: { top: scrollPos.elementsStyles.get(MENU_BAR_PATH) },
                          'data-path': MENU_BAR_PATH,
                          onKeyDown: handleKeyDown,
                          onFocus: () => setIsFocused(true),
                          onBlur: handleMenuBarBlur
                        }}
                        expandTo={[
            <Expander key='left-menu-compressed' area="lt" expandOrder={1} expandTo={leftMenuExpanded}>
              <BurgerMenu identity={identity} opened={opened} setFinalState={setFinalState} domRef={domRef}>
                {leftChildren}
              </BurgerMenu>
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
      </NoCaptionContext.Provider>
    </BindGroupElement>
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


interface BurgerMenu {
  identity: object,
  opened: boolean,
  domRef: React.RefObject<HTMLDivElement>,
  setFinalState: (s: MenuItemState) => void,
  children: ReactElement<MenuItem>[]
}

function BurgerMenu({ identity, opened, domRef, setFinalState, children}: BurgerMenu) {
  const path = usePath(identity);
  const { focusClass, focusHtml } = useFocusControl(path);

  const currentPath = useContext(PathContext);

  // Keyboard controls logic
  const keyboardOperation = useRef(false);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch(e.key) {
      case ENTER_KEY:
        if (!opened && domRef.current) {
          e.stopPropagation();
          keyboardOperation.current = true;
          setFinalState({ opened: true });
        }
        break;
      case ESCAPE_KEY:
        if (opened) {
          keyboardOperation.current = true;
          e.stopPropagation();
          e.currentTarget.focus();
          setFinalState({ opened: false });
        } 
        break;
      case ARROW_RIGHT_KEY:
        if (opened) e.stopPropagation();
        break;
      case ARROW_DOWN_KEY:
      case ARROW_UP_KEY:
        if (keyboardOperation.current) {
          e.stopPropagation();
          break;
        }
        if (!opened || !domRef.current) break;
        handleArrowUpDown(e, domRef.current, currentPath, children);
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
          <MenuPopupElement popupLrMode={false} keyboardOperation={keyboardOperation}>{children}</MenuPopupElement>}
    </div>
  )
}

export const mainMenuComponents = { 
  MainMenuBar,
  MenuFolderItem, 
  MenuExecutableItem, 
  MenuCustomItem, 
  MenuItemsGroup, 
  MenuUserItem, 
  MainMenuClock
};

export { MenuControlsContext };
export type { MenuItemState, MenuItem };
