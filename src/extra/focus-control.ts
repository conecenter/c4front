import React from 'react';
import { SEL_FOCUS_FRAME, VISIBLE_CHILD_SELECTOR } from './css-selectors';

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

function getFocusableNodes(root: Element | Document | null | undefined) {
    if (!root) return [];
    const focusWrappers = root.querySelectorAll<HTMLElement>(`${SEL_FOCUS_FRAME}${VISIBLE_CHILD_SELECTOR}`);
    return Array.from(focusWrappers);
}

function getActiveFocusWrapper(doc: Document | null) {
    return doc?.activeElement?.closest<HTMLElement>(SEL_FOCUS_FRAME);
}

export { useFocusControl, Focusable, getFocusableNodes, getActiveFocusWrapper };