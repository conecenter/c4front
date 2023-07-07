import React, { useContext } from 'react';
import clsx from 'clsx';
import { NoFocusContext } from './labeled-element';

const PathContext = React.createContext("path");

interface FocusControlObj {
    focusClass?: string,
    focusHtml?: { 'data-path': string, tabIndex: number },
    isFocused?: boolean
}

function useFocusControl(path: string | undefined): FocusControlObj {
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
    path?: string,
    children: (obj: FocusControlObj) => React.ReactNode
}

const Focusable = ({path, children}: FocusableProps) => {
    const focusProps = useFocusControl(path);
    return children(focusProps);
}

export type { FocusControlObj };
export { PathContext, useFocusControl, Focusable };