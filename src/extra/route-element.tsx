import React, { ReactElement, useMemo, useRef, MouseEvent } from 'react';
import clsx from 'clsx';
import { COPY_EVENT, CUT_EVENT, PASTE_EVENT, useExternalKeyboardControls } from './focus-module-interface';
import { NoFocusContext } from './labeled-element';
import { copyToClipboard } from './utils';
import { useSync } from '../main/vdom-hooks';
import { identityAt } from '../main/vdom-util';
import { getPath, useFocusControl } from './focus-control';
import { isInsidePopup } from './dom-utils';

const keyboardActionIdOf = identityAt('keyboardAction');

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
    
    // Server sync
    const [_, sendPatch] = useSync(keyboardActionIdOf(identity));

    // Event handlers
    function preventFocusInsidePopup(e: MouseEvent) {
        if (isInsidePopup(e.target as HTMLElement)) e.preventDefault();
    }

    // External keyboard event handlers
    const customEventHandlers = {
		[PASTE_EVENT]: (e: CustomEvent) => sendPatch({value: e.detail, headers: {'x-r-paste': ''}}),
		[COPY_EVENT]: copyRouteToClipboard,
		[CUT_EVENT]: copyRouteToClipboard
	};

	useExternalKeyboardControls(routeElemRef.current, customEventHandlers);

    function copyRouteToClipboard(e: CustomEvent) {
        e.stopPropagation();
        const wholeCode = routeParts.reduce((accum, elem) => accum + (elem.props?.text ?? ''), '');
		copyToClipboard(wholeCode);
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