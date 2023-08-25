import { ReactElement, useContext, useEffect, useState } from 'react';
import { ARROW_DOWN_KEY, ARROW_UP_KEY, KEY_TO_DIRECTION } from '../../main/keyboard-keys';
import { Patch, PatchHeaders } from '../exchange/input-sync';
import { MenuItemState } from './main-menu-bar';
import { MenuItem, MenuItemsGroup } from './main-menu-items';
import { isInstanceOfNode } from '../dom-utils';
import { HighlightedItemContext } from './menu-folder-item';

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
    if (isInstanceOfNode(e.relatedTarget) && e.currentTarget.contains(e.relatedTarget) && e.currentTarget !== e.relatedTarget) return;
    setFinalState({ opened: false });
}

function handleArrowUpDown(
    event: React.KeyboardEvent, 
    elem: HTMLElement, 
    currentPath: string, 
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
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
    children?: ReactElement<MenuItem | MenuItemsGroup>[]
) {
    if (!elem) return;
    const flatChildren = flattenMenuChildren(children);
    const pathToFocus = flatChildren[0]?.props.path;
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
/////////////////////////////////////////////
const KEY_TO_CHANGE = {
    [ARROW_UP_KEY]: -1,
    [ARROW_DOWN_KEY]: 1
}

function useOptionHighlighter(elems: React.ReactElement<MenuItem>[] = [], opened: boolean) {
    const [highlightedOption, setHighlightedOption] = useState<number | null>(null);

    const elemsNum = elems.length;

    useEffect(() => {
        setHighlightedOption(null);
    }, [opened, elemsNum]);

    const moveHighlighter = (key: typeof ARROW_DOWN_KEY | typeof ARROW_UP_KEY) => {
        setHighlightedOption(ind => ind === null ? 0
            : (ind + KEY_TO_CHANGE[key] + elemsNum) % elemsNum);
    }

    const highlightedItemPath = highlightedOption === null ? '' : elems[highlightedOption]?.props?.path || '';

    return { highlightedItemPath, moveHighlighter };
}

function useItemHiglighter(ref: React.MutableRefObject<HTMLDivElement | null>, path?: string) {
    const highlightedItemPath = useContext(HighlightedItemContext);

    useEffect(() => {
        if (path === highlightedItemPath) ref.current?.focus();
    }, [highlightedItemPath]);
}

export { patchToState, stateToPatch, handleMenuBlur, getNextArrayIndex, handleArrowUpDown, isMenuItemsGroup, focusFirstMenuItem, flattenMenuChildren, useOptionHighlighter, useItemHiglighter };