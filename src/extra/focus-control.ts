import React, { useContext } from 'react';
import clsx from 'clsx';
import { NoFocusContext } from './labeled-element';

const PathContext = React.createContext("path");
PathContext.displayName = "PathContext";

interface FocusControlObj {
    focusClass?: string,
    focusHtml?: { 'data-path': string, tabIndex: number },
    isFocused?: boolean
}

function useFocusControl(path: string | undefined): FocusControlObj {
    const noFocusCtx = useContext(NoFocusContext);
    const currentPath = useContext(PathContext);
    if (!path) return {};
    const isFocused = currentPath === path;
    const focusHtml = { 'data-path': path, tabIndex: 1 };
    const focusClass = clsx(!noFocusCtx && 'focusWrapper', isFocused && 'activeFocusWrapper');
    return { focusClass, focusHtml, isFocused };
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