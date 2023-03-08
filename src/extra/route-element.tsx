import React, { ReactElement, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { COPY_EVENT, CUT_EVENT, DELETE_EVENT, PASTE_EVENT, useExternalKeyboardControls } from './focus-module-interface';
import { NoFocusContext } from './labeled-element';
import { copyToClipboard } from './utils';
import { useSync } from '../main/vdom-hooks';
import { identityAt } from '../main/vdom-util';
import { getPath, useFocusControl } from './focus-control';
import { useAddEventListener } from './custom-hooks';

const keyboardActionIdOf = identityAt('keyboardAction');

interface RouteElementProps {
    key: string,
    identity: Object,
    keyboardAction?: boolean,
    compact?: boolean,
    routeParts: ReactElement[],  // ChipElements
    extraParts?: ReactElement[]
}

function RouteElement({identity, keyboardAction, compact, routeParts, extraParts}: RouteElementProps) {
    const routeElemRef = useRef(null);

    const readOnly = !keyboardAction;

    // Focus functionality
    const path = useMemo(() => getPath(identity), [identity]);
    const { focusClass, focusHtml } = useFocusControl(path);

    const className = clsx('routeElement focusFrameProvider', focusClass, compact && 'compact');
    
    // Server sync
    const [_, sendPatch] = useSync(keyboardActionIdOf(identity));

    // Event handlers
    function preventMenuItemsFocus(e: React.MouseEvent) {
        if ((e.target as HTMLElement).closest('.menuItem')) e.preventDefault();
    }

    // External keyboard event handlers
    const customEventHandlers = {
		[PASTE_EVENT]: (e: CustomEvent) => !readOnly && sendPatch({value: e.detail, headers: {'x-r-paste': '1'}}),
		[COPY_EVENT]: copyRouteToClipboard,
		[CUT_EVENT]: copyRouteToClipboard
	};

    function copyRouteToClipboard(e: CustomEvent) {
        e.stopPropagation();
        const allParts = [...routeParts, ...(extraParts ?? [])];
        const wholeCode = allParts.reduce((accum, elem) => accum + (elem.props?.text ?? ''), '');
		copyToClipboard(wholeCode);
	}

    function sendKeyToServer(e: CustomEvent<{key: string, vk?: boolean}>) {
        if (!readOnly) sendPatch({value: e.detail.key, headers: {'x-r-input': '1'}});
    }

	useExternalKeyboardControls(routeElemRef.current, customEventHandlers);
    useAddEventListener(routeElemRef.current, DELETE_EVENT, sendKeyToServer, true);

    return (
        <div ref={routeElemRef}
             className={className}
             {...focusHtml}
             style={{...readOnly && {borderColor: "transparent"}}}
             onMouseDownCapture={preventMenuItemsFocus}
        >
            <NoFocusContext.Provider value={true} >
                {routeParts}
                {extraParts && 
                    <span className='extraParts'>{extraParts}</span>}
            </NoFocusContext.Provider>
        </div>
    );
}

export { RouteElement };