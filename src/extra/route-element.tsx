import React, { ReactElement, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { useAddEventListener } from './custom-hooks';
import { COPY_EVENT } from './focus-module-interface';
import { NoFocusContext } from './labeled-element';
import { getPath, useFocusControl } from './focus-control';


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
	useAddEventListener(routeElemRef.current, COPY_EVENT, handleClipboardWrite);

    async function handleClipboardWrite(e: CustomEvent) {
		// On Firefox writing to the clipboard is blocked for non user-initiated event callbacks
        e.stopPropagation();
		try {
            const wholeCode = routeParts.reduce((accum, elem) => accum + (elem.props?.value ?? ''), '');
			await navigator.clipboard.writeText(wholeCode);
		} catch(err) {
			console.log(err);
		}
	}

    return (
        <div ref={routeElemRef} {...focusHtml} className={className} >
            <NoFocusContext.Provider value={true} >
                {routeParts}
            </NoFocusContext.Provider>
        </div>
    );
}

 export { RouteElement };