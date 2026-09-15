import React, {createContext, ReactElement, useCallback, useContext, useEffect, useRef, useState} from "react";
import clsx from 'clsx';
import {Expander, ExpanderArea} from '../../main/expander-area';
import {focusFirstMenuItem, handleArrowUpDown} from './main-menu-utils';
import {MainMenuClock} from './main-menu-clock';
import {useFocusControl} from "../focus-control";
import {ARROW_DOWN_KEY, ARROW_RIGHT_KEY, ARROW_UP_KEY, ENTER_KEY, ESCAPE_KEY, M_KEY} from "../../main/keyboard-keys";
import {MenuCustomItem, MenuExecutableItem, MenuItemsGroup, MenuUserItem} from './main-menu-items';
import {MenuFolderItem} from "./menu-folder-item";
import {BindGroupElement} from "../binds/binds-elements";
import {NoCaptionContext, usePath} from "../../main/vdom-hooks";
import {isInstanceOfNode} from "../dom-utils";
import {VISIBLE_CHILD_SELECTOR} from "../css-selectors";
import {PathContext} from "../focus-announcer";
import {SVGElement} from "../../main/image";
import {MainMenuBarProps, MenuCustomItemProps, MenuExecutableItemProps, MenuFolderItemProps, MenuUserItemProps} from "types/c4gen.MainMenuApi";
import { usePopupState } from "../popup-elements/popup-manager";
import { PopupElement } from "../popup-elements/popup-element";

const MENU_BAR_PATH = 'main-menu-bar';
const BURGER_POPUP_KEY = 'burger-menu';
const KEY_MODIFICATOR = { ArrowLeft: -1, ArrowRight: 1 };

type OnArrowLeftRight = (path: string, elem: HTMLElement, key: 'ArrowLeft' | 'ArrowRight', isOpened: boolean) => void;

interface MenuControlsContext { 
  onArrowLeftRight?: OnArrowLeftRight, 
  setReadyArrowLeftRight?: () => boolean
}

const MenuControlsContext = createContext<MenuControlsContext>({});

const isMenuFolderType = (item: ReactElement) => item.type === MenuFolderItem || item.type === MenuUserItem;
const isMenuOpenCombo = (e: KeyboardEvent) => (e.ctrlKey || e.altKey) && e.key === M_KEY;


type MenuItem = MenuFolderItemProps | MenuExecutableItemProps | MenuCustomItemProps | MenuUserItemProps;

function MainMenuBar({identity, icon, leftChildren, rightChildren}: MainMenuBarProps) {
  const { toggle } = usePopupState(BURGER_POPUP_KEY);

  const domRef = useRef<HTMLDivElement>(null);

  const currentPath = useContext(PathContext);
  const prevFocusedPath = useRef<string | null>(null);

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
    <Expander key='left-menu-with-icons' className='leftMenuBox' area="lt" expandTo={leftMenuWithLogo ? [leftMenuWithLogo] : undefined}>
      {leftChildren}
    </Expander>
  );

  const leftMenuExpanded = (
    <Expander key='left-menu-expanded'
              className='leftMenuBox hiddenIcons'
              area="lt"
              expandOrder={3}
              expandTo={[leftMenuWithIcons]}>
      {leftChildren}
    </Expander>
  );

	// Right part of menu
	const rightMenuCompressed = rightChildren ? getRightMenuCompressed(rightChildren) : null;

  const rightMenuExpanded = (
    <Expander key='right-menu-reduced' className='rightMenuBox rightMenuCompressed' expandOrder={2} area='rt' expandTo={
      [<Expander key='right-menu-expanded' className='rightMenuBox' area='rt'>
        {rightChildren}
      </Expander>]
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
        if (isBurgerMenu) toggle(true);
        window!.scrollTo({top: 0});
        const firstFocusablePath = leftChildren?.[0].props.path;
        const pathSelector = `[data-path='${firstFocusablePath}']`;
        setTimeout(() => {
          const firstFocusableItem = doc!.querySelector<HTMLElement>(`${pathSelector}${VISIBLE_CHILD_SELECTOR}`);
          firstFocusableItem?.focus();
          if (!isBurgerMenu) firstFocusableItem?.click();
        });
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
    const menuItems = [...(leftChildren || []), ...(rightChildren || [])];
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
    if (isOpened && isMenuFolderType(menuItems[nextMenuItemIndex])) {
      queueMicrotask(() => nextFocusableItem?.click());  // pause to let popup closing finish
    }
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
                          'data-path': MENU_BAR_PATH,
                          onKeyDown: handleKeyDown,
                          onFocus: () => setIsFocused(true),
                          onBlur: handleMenuBarBlur
                        }}
                        expandTo={[
            <Expander key='left-menu-compressed' area="lt" expandOrder={1} expandTo={[leftMenuExpanded]}>
              <BurgerMenu identity={identity} domRef={domRef}>
                {leftChildren || []}
              </BurgerMenu>
            </Expander>,

            <Expander key='right-menu-compressed'
                      className='rightMenuBox rightMenuCompressed'
                      area="rt"
                      expandOrder={0}
                      expandTo={[rightMenuExpanded]}>
              {rightMenuCompressed}
            </Expander>
          ]}/>
        </MenuControlsContext.Provider>
      </NoCaptionContext.Provider>
    </BindGroupElement>
  );
}

function getRightMenuCompressed(rightChildren: ReactElement<MenuItem>[]) {
  const menuUserItem = rightChildren.find(child => child.type === MenuUserItem) as ReactElement<MenuUserItemProps> | undefined;
  if (!menuUserItem) return null;

  const rightChildrenFiltered = rightChildren
     .filter((child: JSX.Element) => ![MenuUserItem, MainMenuClock].includes(child.type));
  const rightChildrenGroup = (
    <MenuItemsGroup key=':right-children-compressed'>
      {rightChildrenFiltered}
    </MenuItemsGroup>
  );

  const menuUserChildren = React.Children.toArray(menuUserItem.props.children);
  const showChildren = menuUserChildren.length > 0;
  const logOutIndex = menuUserChildren.findIndex(child => (child as React.ReactElement).props.name === 'Log out');
  const insertIndex = logOutIndex < 0 ? menuUserChildren.length : logOutIndex;
  menuUserChildren.splice(insertIndex, 0, rightChildrenGroup)

  return React.cloneElement(menuUserItem, {}, showChildren ? menuUserChildren : null);
}


interface BurgerMenu {
  identity: object,
  domRef: React.RefObject<HTMLDivElement>,
  children: ReactElement<MenuItem>[]
}

function BurgerMenu({ identity, domRef, children}: BurgerMenu) {
  const { isOpened, toggle } = usePopupState(BURGER_POPUP_KEY);

  const path = usePath(identity);
  const { focusClass, focusHtml } = useFocusControl(path);

  const currentPath = useContext(PathContext);

  // Keyboard controls logic
  const keyboardOperation = useRef(false);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch(e.key) {
      case ENTER_KEY:
        if (!isOpened && domRef.current) {
          e.stopPropagation();
          keyboardOperation.current = true;
          toggle(true);
        }
        break;
      case ESCAPE_KEY:
        if (isOpened) {
          keyboardOperation.current = true;
          e.stopPropagation();
          e.currentTarget.focus();
          toggle(false);
        } 
        break;
      case ARROW_RIGHT_KEY:
        if (isOpened) e.stopPropagation();
        break;
      case ARROW_DOWN_KEY:
      case ARROW_UP_KEY:
        if (keyboardOperation.current) {
          e.stopPropagation();
          break;
        }
        if (!isOpened || !domRef.current) break;
        handleArrowUpDown(e, domRef.current, currentPath, children);
    }
  };

  useEffect(() => {
    if (isOpened && keyboardOperation.current) {
      setTimeout(() => focusFirstMenuItem(domRef.current, children));
      keyboardOperation.current = false;
    }
  }, [isOpened]);

  return (
    <div className={clsx(focusClass, 'menuBurgerBox')}
         onKeyDown={handleKeyDown}
         {...focusHtml}
         ref={domRef} >
      <button key='left-menu'
              className='btnBurger'
              onClick={() => toggle(!isOpened)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1"
             viewBox="0 0 32 32">
          <line strokeLinecap="round" x1="2" x2="30" strokeWidth="4"
                y1={isOpened ? '16' : '9'}
                y2={isOpened ? '16' : '9'}
                style={isOpened ? {transform: "rotate(-45deg)"} : {}}/>
          <line strokeLinecap="round" x1="2" y1="17" x2="30" y2="17" strokeWidth="4"
                style={isOpened ? {opacity: "0"} : {}}/>
          <line strokeLinecap="round" x1="2" x2="30" strokeWidth="4"
                y1={isOpened ? '16' : '25'}
                y2={isOpened ? '16' : '25'}
                style={isOpened ? {transform: "rotate(45deg)"} : {}}/>
        </svg>
      </button>

      {isOpened &&
        <PopupElement
          popupKey={BURGER_POPUP_KEY}
          className='menuPopupBox'
          lrMode={false}
          keyboardOverride={true}
          children={children}
        />}
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
export type { MenuItem };