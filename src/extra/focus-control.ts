import React, { useContext, useMemo } from 'react';
import clsx from 'clsx';


const PathContext = React.createContext("path");


interface Identity {
    key?: string
    parent?: Identity,
}

function useFocusControl(identity: Identity) {
    const currentPath = useContext(PathContext);

    const path = useMemo(() => getPath(identity), []); // useMemo - can identity change during lifetime?

    const currentlyFocused = currentPath && path && currentPath === path;

    const className = clsx('focusWrapper', currentlyFocused && 'activeFocusWrapper');

    return { className, path };
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

export { PathContext, useFocusControl };
