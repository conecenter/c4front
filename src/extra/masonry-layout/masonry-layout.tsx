import React, { ReactElement, ReactNode, useState } from "react";
import GridLayout from 'react-grid-layout';
import { Patch, usePatchSync } from "../exchange/patch-sync";
import { GridItemWrapper } from "./grid-item";

const GRID_ROW_SIZE = 20;
const GRID_MARGIN_SIZE = 10;
const GRID_ITEM_PROPS = ['i', 'x', 'y', 'w', 'h', 'static'] as const;

const serverStateToState = (s?: string): GridLayout.Layout[] => s ? JSON.parse(s) : [];
const changeToPatch = (ch: GridLayout.Layout[]): Patch => ({ value: JSON.stringify(ch) });
const patchToChange = (p: Patch): GridLayout.Layout[] => JSON.parse(p.value);


interface MasonryLayout {
    identity: object,
    layout?: string,
    children?: ReactNode
}

function MasonryLayout({ identity, layout: layoutJSON, children }: MasonryLayout) {
    const { currentState: layoutState, sendFinalChange } =
        usePatchSync(identity, 'receiver', layoutJSON, false, serverStateToState, changeToPatch, patchToChange, (prev, ch) => ch);

    const sendLayoutChange = (newLayout: GridLayout.Layout[]) =>
        !isEqualLayout(layoutState, newLayout) && sendFinalChange(newLayout);

    const [minHMap, setMinHMap] = useState<{ [key: string]: number | undefined }>({});

    const correctHeight = (itemId: string) => (element: HTMLDivElement | null) => {
        if (!element) return;
        const { offsetHeight, scrollHeight } = element;
        if (scrollHeight > offsetHeight) {
            const newRowHeight = Math.ceil((scrollHeight + GRID_MARGIN_SIZE) / (GRID_ROW_SIZE + GRID_MARGIN_SIZE));
            setMinHMap((prev) => prev[itemId] === newRowHeight
                ? prev : { ...prev, [itemId]: newRowHeight });
        }
    }

    const childrenArray = React.Children.toArray(children) as ReactElement<{ gridId?: string }>[];

    const layout = layoutState.map(item => {
        const minH = minHMap[item.i];
        if (!minH) return item;
        const h = minH > item.h ? minH : item.h;
        return { ...item, h };
    });

    return (
        <GridLayout
            layout={layout}
            className="layout"
            cols={6}
            margin={[GRID_MARGIN_SIZE, GRID_MARGIN_SIZE]}
            rowHeight={GRID_ROW_SIZE}
            width={1200}
            onResizeStop={sendLayoutChange}
            onDragStop={sendLayoutChange}
        >
            {layout.map((item) => {
                const child = childrenArray.find((child) => child.props.gridId === item.i);
                return <GridItemWrapper key={item.i} itemLayout={item} correctHeight={correctHeight(item.i)} children={child} />;
            })}
        </GridLayout>
    );
}

const isEqualLayout = (layout: GridLayout.Layout[], newLayout: GridLayout.Layout[]) => {
    if (layout.length !== newLayout.length) return false;
    return layout.every((item) => {
        const newItem = newLayout.find((i) => i.i === item.i);
        if (!newItem) return false;
        return GRID_ITEM_PROPS.every((prop) => item[prop] === newItem[prop]);
    });
}

export { MasonryLayout };