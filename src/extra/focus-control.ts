import React, { useContext, useMemo } from 'react';
import clsx from 'clsx';
import { NoFocusContext } from './labeled-element';

const PathContext = React.createContext("path");

interface FocusControlObj {
    focusClass?: string,
    focusHtml?: { 'data-path': string, tabIndex: number }
}

function useFocusControl(identity?: Identity): FocusControlObj {
    if (!identity) return {};
    const path = useMemo(() => {
        console.log('calc identity')
        return getPath(identity);
    }, [identity])
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
    identity: Identity,
    children: (obj: FocusControlObj) => React.ReactNode
}

const Focusable = ({identity, children}: FocusableProps) => {
    const focusProps = useFocusControl(identity);
    return children(focusProps);
}


interface Identity {
    key?: string
    parent?: Identity,
}

function getPath(identity: Identity) {
    let path = '';
    let element: Identity | undefined = identity;
    while (element) {
        if (element.key) path += `/${element.key}`;
        element = element.parent;
    }
    return path;
}


export type { FocusControlObj };
export { PathContext, useFocusControl, Focusable, getPath };
