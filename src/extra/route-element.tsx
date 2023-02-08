import React, { ReactElement, useMemo, useRef, KeyboardEvent } from 'react';
import clsx from 'clsx';
import { COPY_EVENT, CUT_EVENT, DELETE_EVENT, PASTE_EVENT, useExternalKeyboardControls } from './focus-module-interface';
import { NoFocusContext } from './labeled-element';
import { copyToClipboard } from './utils';
import { useSync } from '../main/vdom-hooks';
import { identityAt } from '../main/vdom-util';
import { getPath, useFocusControl } from './focus-control';
import { isInsidePopup } from './dom-utils';
import { useAddEventListener } from './custom-hooks';

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
    function preventFocusInsidePopup(e: React.MouseEvent) {
        if (isInsidePopup(e.target as HTMLElement)) e.preventDefault();
    }

    function sendKeyToServer(e: KeyboardEvent | CustomEvent<{key: string, vk?: boolean}>) {
        e.stopPropagation();
        const key = isKeyboardEvent(e) ? e.key : e.detail.key;
        const isPrintableKey = /^[a-z0-9]$/i.test(key);
        if (isPrintableKey) sendPatch({value: key, headers: {'x-r-input': '1'}});
    }

    // External keyboard event handlers
    const customEventHandlers = {
		[PASTE_EVENT]: (e: CustomEvent) => sendPatch({value: e.detail, headers: {'x-r-paste': '1'}}),
		[COPY_EVENT]: copyRouteToClipboard,
		[CUT_EVENT]: copyRouteToClipboard
	};

    function copyRouteToClipboard(e: CustomEvent) {
        e.stopPropagation();
        const wholeCode = routeParts.reduce((accum, elem) => accum + (elem.props?.text ?? ''), '');
		copyToClipboard(wholeCode);
	}

	useExternalKeyboardControls(routeElemRef.current, customEventHandlers);
    useAddEventListener(routeElemRef.current, DELETE_EVENT, sendKeyToServer, true);

    return (
        <div ref={routeElemRef}
             className={className}
             {...focusHtml} 
             onKeyDown={sendKeyToServer} 
             onMouseDownCapture={preventFocusInsidePopup} 
        >
            <NoFocusContext.Provider value={true} >
                {routeParts}
            </NoFocusContext.Provider>
        </div>
    );
}

const isKeyboardEvent = (e: KeyboardEvent | CustomEvent): e is KeyboardEvent => e.type === 'keydown';

 export { RouteElement };