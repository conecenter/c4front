import React, { ReactNode, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { getPath, useFocusControl } from './focus-control';
import { usePatchSync } from './exchange/patch-sync';
import { useAddEventListener } from './custom-hooks';
import { COPY_EVENT } from './focus-module-interface';


interface RouteElementProps {
    key: string,
    identity: Object,
    compact?: boolean,
    routeParts: RoutePartData[]
 }
 
 interface RoutePartData {
    text: string,
    done: boolean,
    hint?: string,
    children?: ReactNode[]
}

function RouteElement({identity, compact, routeParts}: RouteElementProps) {
    const lastDone = routeParts.findIndex(part => !part.done) - 1;
    const path = useMemo(() => getPath(identity), [identity]);

    const { handleClick } = useRouteElementSync(identity, 'receiver');

    // Copy on Ctrl+C functionality
    const routeElemRef = useRef(null);
	useAddEventListener(routeElemRef.current, COPY_EVENT, handleClipboardWrite);

    async function handleClipboardWrite(e: CustomEvent) {
		// On Firefox writing to the clipboard is blocked for non user-initiated event callbacks
        e.stopPropagation();
		try {
            const wholeCode = routeParts.reduce((accum, part) => accum + part.text, '');
			await navigator.clipboard.writeText(wholeCode);
		} catch(err) {
			console.log(err);
		}
	}

    return (
        <div ref={routeElemRef} className={clsx('routeElement', compact && 'compact')}>
            {routeParts.map((part, ind) => {
                const { text, hint, done } = part;
                const isLastDone = ind === lastDone;

                const partPath = `${path}/part-${ind}`;
                const { focusClass, focusHtml } = useFocusControl(partPath);
                return (
                    <div key={`${ind}`}
                         {...focusHtml}
                         className={clsx(done && 'routePartDone', isLastDone && 'isLastDone', focusClass)}
                         // style={onClick ? {cursor: 'pointer'} : undefined}
                         title={hint}
                         onClick={() => handleClick(ind)} >
                        {text}
                    </div>
                );
            })}
        </div>
    );
}

function useRouteElementSync(
    identity: Object,
    receiverName: string
) {
    const {sendFinalChange} = usePatchSync<string, string, string>(
        identity,
        receiverName,
        '',
        false,
        (b) => b,
        (b) => ({
            headers: {"x-r-clicked-part": b},
            value: ""
        }),
        (p) => '',
        (prevState, ch) => ch
    );
    return { handleClick: (index: number) => sendFinalChange(String(index)) }
  }

 export { RouteElement };
