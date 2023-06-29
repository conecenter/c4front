import React, { useContext } from 'react';
import clsx from 'clsx';
import { NoFocusContext } from './labeled-element';
import { usePath } from '../main/vdom-hooks';

const PathContext = React.createContext("path");

interface FocusControlObj {
    focusClass?: string,
    focusHtml?: { 'data-path': string, tabIndex: number },
    isFocused?: boolean
}

function useFocusControl(identity?: Object): FocusControlObj {
    const path = usePath(identity);
    if (!path) return {};
    const noFocusCtx = useContext(NoFocusContext);
    const isFocused = isCurrentlyFocused(path);
    const focusHtml = { 'data-path': path, tabIndex: 1 };
    const focusClass = clsx(!noFocusCtx && 'focusWrapper', isFocused && 'activeFocusWrapper');
    return { focusClass, focusHtml, isFocused };
}

function isCurrentlyFocused(path: string | undefined) {
    const currentPath = useContext(PathContext);
    return currentPath === path;
}


interface FocusableProps {
    identity?: Object,
    children: (obj: FocusControlObj) => React.ReactNode
}

const Focusable = ({identity, children}: FocusableProps) => {
    const focusProps = useFocusControl(identity);
    return children(focusProps);
}

export type { FocusControlObj };
export { PathContext, useFocusControl, Focusable };