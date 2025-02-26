import React from 'react';

// .focusWrapper - ability to have focus frame
// [data-path] - unique element id (used not just for focus frame)

interface FocusControlObj {
    focusClass?: string,
    focusHtml?: { 'data-path': string, tabIndex: 1 }
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

export { useFocusControl, Focusable };