import React, { MouseEventHandler, ReactNode, useMemo } from 'react';
import clsx from 'clsx';
import { getPath, useFocusControl } from './focus-control';
import { usePatchSync } from './exchange/patch-sync';


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
    children?: ReactNode[],
    onClick?: MouseEventHandler<HTMLDivElement>
}

function RouteElement({identity, compact, routeParts}: RouteElementProps) {
    const lastDone = routeParts.findIndex(part => !part.done) - 1;
    const path = useMemo(() => getPath(identity), [identity]);

    const { handleClick } = useRouteElementSync(identity, 'receiver');

    return (
        <div className={clsx('routeElement', compact && 'compact')}>
            {routeParts.map((part, ind) => {
                const { text, hint, done, onClick } = part;
                const isLastDone = ind === lastDone;

                const partPath = `${path}/part-${ind}`;
                const { focusClass, focusHtml } = useFocusControl(partPath);
                return (
                    <div key={`${ind}`}
                         {...focusHtml}
                         className={clsx(done && 'routePartDone', isLastDone && 'isLastDone', focusClass)}
                         style={onClick ? {cursor: 'pointer'} : undefined}
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
            headers: {"x-r-clickedPart": b},
            value: ""
        }),
        (p) => '',
        (prevState, ch) => ch
    );
    return { handleClick: (index: number) => sendFinalChange(String(index)) }
  }

 export { RouteElement };
