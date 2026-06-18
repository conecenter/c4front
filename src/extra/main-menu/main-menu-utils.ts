import { ReactElement } from 'react';
import { KEY_TO_DIRECTION } from '../../main/keyboard-keys';
import { Patch, PatchHeaders } from '../exchange/patch-sync';
import { MenuItem, MenuItemsGroup } from './main-menu-items';
import { VISIBLE_CHILD_SELECTOR } from '../css-selectors';
import { MenuItemsGroupProps, MenuItemState } from 'types/c4gen.MainMenuApi';

// Server sync functionality
function patchToState(patch: Patch): MenuItemState {
    const headers = patch.headers as PatchHeaders;
	return { opened: !!headers['x-r-opened'] };
}

function stateToPatch({ opened }: MenuItemState): Patch {
	const headers = { 'x-r-opened': opened ? '1' : '' };
	return { value: '', headers };
}

// Helper functions
function handleArrowUpDown(
    event: React.KeyboardEvent, 
    elem: HTMLElement, 
    currentPath: string, 
    children?: ReactElement<MenuItem | MenuItemsGroupProps>[]
) {
    const flatChildren = flattenMenuChildren(children);
    const focusedIndex = flatChildren.findIndex(child => child.props.path === currentPath);
    const nextFocusedIndex = getNextArrayIndex(
        flatChildren.length, 
        focusedIndex, 
        KEY_TO_DIRECTION[event.key as 'ArrowUp' | 'ArrowDown']
    );
    if (nextFocusedIndex === undefined) return;
    const pathToFocus = flatChildren[nextFocusedIndex].props.path;
    const itemToFocus: HTMLElement | null = elem.ownerDocument.querySelector(`[data-path='${pathToFocus}']${VISIBLE_CHILD_SELECTOR}`);
    if (itemToFocus) {
        itemToFocus.focus();
        event.preventDefault();
        event.stopPropagation();
    }
}

const getNextArrayIndex = (arrLength: number, currIndex: number, direction: string = 'up') => {
    switch(direction) {
        case 'up':
            return currIndex <= 0 ? arrLength - 1 : currIndex - 1;                
        case 'down':
            return arrLength <= currIndex + 1 ? 0 : currIndex + 1;
    }
}

function focusFirstMenuItem(
    elem: HTMLElement | null, 
    children?: ReactElement<MenuItem | MenuItemsGroupProps>[]
) {
    if (!elem) return;
    const flatChildren = flattenMenuChildren(children);
    const pathToFocus = flatChildren[0]?.props.path;
    if (pathToFocus) {
        const itemToFocus: HTMLElement | null = elem?.querySelector(`[data-path='${pathToFocus}']`);
        itemToFocus?.focus();
    }
}

function isMenuItemsGroup(item: ReactElement<MenuItem | MenuItemsGroupProps>): item is ReactElement<MenuItemsGroupProps> { 
    return (item as ReactElement<MenuItemsGroupProps>).type === MenuItemsGroup; 
  }

function flattenMenuChildren(children?: ReactElement<MenuItem | MenuItemsGroupProps>[]): ReactElement<MenuItem>[] {
    if (!children) return [];
    return children.reduce((res: ReactElement<MenuItem>[], child) => {
        return res.concat(
            // @ts-ignore
            isMenuItemsGroup(child)
                ? flattenMenuChildren(child.props.children)
                : child
        );
    }, [])
}

export { patchToState, stateToPatch, getNextArrayIndex, handleArrowUpDown, focusFirstMenuItem };