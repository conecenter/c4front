import React, { useContext } from 'react';
import clsx from 'clsx';

const PathContext = React.createContext("path");

interface FocusControlObj {
    focusClass?: string,
    focusHtml?: { 'data-path': string, tabIndex: number }
}

function isCurrentlyFocused(path: string | undefined) {
    const currentPath = useContext(PathContext);
    return currentPath && path && currentPath === path;
}    

function useFocusControl(path: string | undefined): FocusControlObj {
    if (!path) return {};
    const focusClass = clsx('focusWrapper', isCurrentlyFocused(path) && 'activeFocusWrapper');
    const focusHtml = { 'data-path': path, tabIndex: 1 };
    return { focusClass, focusHtml }
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
export { PathContext, useFocusControl, getPath };
