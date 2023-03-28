import React, { useContext, useMemo } from 'react';
import clsx from 'clsx';
import { NoFocusContext } from './labeled-element';

const PathContext = React.createContext("path");

interface FocusControlObj {
    focusClass?: string,
    focusHtml?: { 'data-path': string, tabIndex: number }
}

function useFocusControl(path: string | undefined): FocusControlObj {
    if (!path) return {};
    const noFocusCtx = useContext(NoFocusContext);
    const focusHtml = { 'data-path': path, tabIndex: 1 };
    const focusClass = clsx(!noFocusCtx && 'focusWrapper', isCurrentlyFocused(path) && 'activeFocusWrapper');
    return { focusClass, focusHtml };
}

function isCurrentlyFocused(path: string | undefined) {
    const currentPath = useContext(PathContext);
    return currentPath && path && currentPath === path;
}


interface FocusableProps {
    path?: string,
    children: (obj: FocusControlObj) => React.ReactNode
}

const Focusable = ({path, children}: FocusableProps) => {
    const focusProps = useFocusControl(path);
    return children(focusProps);
}


interface Identity {
    key?: string
    parent?: Identity,
}

function useGetPath(identity: Identity) {
    const getPath = (identity: Identity) => {
        let path = '';
        let element: Identity | undefined = identity?.parent?.parent;
        while (element) {
            if (element.key) path = `/${element.key}` + path;
            element = element.parent;
        }
        return path;
    }
    const path = useMemo(() => getPath(identity), []);
    return path;
}

function getPath(identity: Identity) {
    let path = '';
    let element: Identity | undefined = identity?.parent?.parent;
    while (element) {
        if (element.key) path = `/${element.key}` + path;
        element = element.parent;
    }
    return path;
}

export type { FocusControlObj };
export { PathContext, useFocusControl, Focusable, getPath, useGetPath, isCurrentlyFocused };