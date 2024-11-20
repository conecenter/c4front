import React, { ReactElement, ReactNode } from "react";
import GridLayout from 'react-grid-layout';
import { Patch, usePatchSync } from "./exchange/patch-sync";

const serverStateToState = (s?: string): GridLayout.Layout[] => s ? JSON.parse(s) : [];
const changeToPatch = (ch: GridLayout.Layout[]): Patch => ({ value: JSON.stringify(ch) });
const patchToChange = (p: Patch): GridLayout.Layout[] => JSON.parse(p.value);

interface MasonryLayout {
    identity: object,
    layout?: string,
    children?: ReactNode
}
// test that diff layout from server is working
function MasonryLayout({ identity, layout: layoutJSON, children }: MasonryLayout) {
    const { currentState: layout, sendFinalChange } =
        usePatchSync(identity, 'receiver', layoutJSON, false, serverStateToState, changeToPatch, patchToChange, (prev, ch) => ch);

    const childrenArray = React.Children.toArray(children) as ReactElement<{ gridId?: string }>[];

    return (
        <GridLayout layout={layout} className="layout" cols={6} rowHeight={30} width={1200} onLayoutChange={sendFinalChange}>
            {layout.map((item) => {
                const child = childrenArray.find((child) => child.props.gridId === item.i);
                return child && <div key={item.i} data-grid={item} >{child}</div>;
            })}
        </GridLayout>
    );
}

export { MasonryLayout };