import React, { ReactElement, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { useAddEventListener } from './custom-hooks';
import { COPY_EVENT } from './focus-module-interface';


interface RouteElementProps {
    key: string,
    identity: Object,
    compact?: boolean,
    routeParts: ReactElement[]  // ChipElements
}

function RouteElement({identity, compact, routeParts}: RouteElementProps) {
    const routeElemRef = useRef(null);

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
        <div ref={routeElemRef} className={clsx('routeElement', compact && 'compact')}>
            {routeParts}
        </div>
    );
}

 export { RouteElement };