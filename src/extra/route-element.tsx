import React, { ReactElement, useMemo, useRef, MouseEvent } from 'react';
import clsx from 'clsx';
import { useAddEventListener } from './custom-hooks';
import { COPY_EVENT } from './focus-module-interface';
import { NoFocusContext } from './labeled-element';
import { copyToClipboard } from './utils';
import { getPath, useFocusControl } from './focus-control';
import { isInsidePopup } from './dom-utils';


interface RouteElementProps {
    key: string,
    identity: Object,
    compact?: boolean,
    routeParts: ReactElement[]  // ChipElements
}

function RouteElement({identity, compact, routeParts}: RouteElementProps) {
    const routeElemRef = useRef(null);

    // Focus functionality
    const path = useMemo(() => getPath(identity), [identity]);
    const { focusClass, focusHtml } = useFocusControl(path);

    const className = clsx('routeElement focusFrameProvider', focusClass, compact && 'compact');

    // Copy on Ctrl+C functionality
	useAddEventListener(routeElemRef.current, COPY_EVENT, copyRouteToClipboard);

    function copyRouteToClipboard(e: CustomEvent) {
        e.stopPropagation();
        const wholeCode = routeParts.reduce((accum, elem) => accum + (elem.props?.text ?? ''), '');
		copyToClipboard(wholeCode);
	}

    function preventFocusInsidePopup(e: MouseEvent) {
        if (isInsidePopup(e.target as HTMLElement)) e.preventDefault();
    }

    return (
        <div ref={routeElemRef} {...focusHtml} className={className} onMouseDownCapture={preventFocusInsidePopup} >
            <NoFocusContext.Provider value={true} >
                {routeParts}
            </NoFocusContext.Provider>
        </div>
    );
}

 export { RouteElement };