import { ReactElement } from 'react';
import { KEY_TO_DIRECTION } from '../../main/keyboard-keys';
import { Patch, PatchHeaders } from '../exchange/patch-sync';
import { MenuItemState } from './main-menu-bar';
import { MenuItem, MenuItemsGroup } from './main-menu-items';
import { isInstanceOfNode } from '../dom-utils';
import { Identity } from '../utils';

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

function handleMenuBlur(e: React.FocusEvent, setFinalState: (s: MenuItemState) => void) {
    if (isInstanceOfNode(e.relatedTarget) && e.currentTarget.contains(e.relatedTarget)) return;
    setFinalState({ opened: false });
}

function handleArrowUpDown(
    event: React.KeyboardEvent,
    elem: HTMLElement,
    currentPath: string,
    ctxToPath: (ctx: Identity) => string,
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
) {
    const flatChildren = flattenMenuChildren(children);
    const focusedIndex = flatChildren.findIndex(child => ctxToPath(child.props.identity) === currentPath);
    const nextFocusedIndex = getNextArrayIndex(
        flatChildren.length,
        focusedIndex,
        KEY_TO_DIRECTION[event.key as 'ArrowUp' | 'ArrowDown']
    );
    if (nextFocusedIndex === undefined) return;
    const pathToFocus = ctxToPath(flatChildren[nextFocusedIndex].props.identity);
    const itemToFocus: HTMLElement | null = elem.querySelector(`[data-path='${pathToFocus}']`);
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
    ctxToPath: (ctx: Identity) => string,
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
) {
    if (!elem) return;
    const flatChildren = flattenMenuChildren(children);
    const pathToFocus = ctxToPath(flatChildren[0]?.props.identity);
    if (pathToFocus) {
        const itemToFocus: HTMLElement | null = elem?.querySelector(`[data-path='${pathToFocus}']`);
        itemToFocus?.focus();
    }
}

function isMenuItemsGroup(item: ReactElement<MenuItem | MenuItemsGroup>): item is ReactElement<MenuItemsGroup> {
    return (item as ReactElement<MenuItemsGroup>).type === MenuItemsGroup;
  }

function flattenMenuChildren(children?: ReactElement<MenuItem | MenuItemsGroup>[]): ReactElement<MenuItem>[] {
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

export { patchToState, stateToPatch, handleMenuBlur, getNextArrayIndex, handleArrowUpDown, focusFirstMenuItem };