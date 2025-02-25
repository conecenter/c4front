import React from 'react';

const PathContext = React.createContext("path");
PathContext.displayName = "PathContext";

interface FocusControlObj {
    focusClass?: string,
    focusHtml?: { 'data-path': string, tabIndex: number }
}

function useFocusControl(path: string | undefined): FocusControlObj {
    return !path ? {} : {
        focusClass: 'focusWrapper',
        focusHtml: { 'data-path': path, tabIndex: 1 }
    };
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