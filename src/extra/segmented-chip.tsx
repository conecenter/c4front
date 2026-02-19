import React, { ReactElement, useContext, useRef } from 'react';
import clsx from 'clsx';
import { COPY_EVENT, CUT_EVENT, DELETE_EVENT, PASTE_EVENT, useExternalKeyboardControls } from './focus-module-interface';
import { copyToClipboard } from './utils';
import { usePath, useSync } from '../main/vdom-hooks';
import { identityAt } from '../main/vdom-util';
import { useFocusControl } from './focus-control';
import { useAddEventListener } from './custom-hooks';
import { UiInfoContext } from './ui-info-provider';

const keyboardActionIdOf = identityAt('keyboardAction');

interface SegmentedChipProps {
    identity: object,
    keyboardAction?: boolean,
    compact?: boolean,
    drawAsRoute?: boolean,
    routeParts: ReactElement[],  // ChipElements
    extraParts?: ReactElement[]
}

function SegmentedChip({identity, keyboardAction, compact, drawAsRoute, routeParts, extraParts}: SegmentedChipProps) {
    const routeElemRef = useRef(null);

    const readOnly = !keyboardAction;

    // Focus functionality
    const path = usePath(identity);
    const { focusClass, focusHtml } = useFocusControl(path);

    const uiType = useContext(UiInfoContext);

    const className = clsx(
        'focusFrameProvider',
        drawAsRoute ? 'routeElement' : 'segmentedChip',
        compact && 'compact',
        focusClass,
        uiType === 'touch' && 'fingerSized'
    );
    
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

	useExternalKeyboardControls(routeElemRef, customEventHandlers);
    useAddEventListener(routeElemRef, DELETE_EVENT, sendKeyToServer, true);

    return (
        <div ref={routeElemRef}
             className={className}
             {...focusHtml}
             style={{...readOnly && {borderColor: "transparent"}}}
             onMouseDownCapture={preventMenuItemsFocus}
        >
            {routeParts}
            {extraParts && 
                <span className='extraParts'>{extraParts}</span>}
        </div>
    );
}

export { SegmentedChip };