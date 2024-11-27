import React, { Key, ReactNode, useEffect, useRef, useState } from "react";
import GridLayout, { Responsive, WidthProvider } from 'react-grid-layout';
import { Patch, usePatchSync } from "../exchange/patch-sync";
import { GridItemWrapper } from "./grid-item";

const GRID_ROW_SIZE = 20;
const GRID_MARGIN_SIZE = 10;
const GRID_ITEM_PROPS = ['i', 'x', 'y', 'w', 'h', 'static'] as const;

const serverStateToState = (s?: string): GridLayout.Layouts => s ? JSON.parse(s) : [];
const changeToPatch = (ch: GridLayout.Layouts): Patch => ({ value: JSON.stringify(ch) });
const patchToChange = (p: Patch): GridLayout.Layouts => JSON.parse(p.value);
const applyChange = (prev: GridLayout.Layouts, ch: GridLayout.Layouts) => ch;

const ResponsiveGridLayout = WidthProvider(Responsive);

interface MasonryLayout {
    identity: object,
    layout?: string,
    breakpoints: { [P: string]: number },
    cols: { [P: string]: number },
    children?: ReactNode[]
}

function MasonryLayout({ identity, layout: layoutJSON, breakpoints, cols, children }: MasonryLayout) {
    const { currentState: layoutState, sendFinalChange } =
        usePatchSync(identity, 'receiver', layoutJSON, false, serverStateToState, changeToPatch, patchToChange, applyChange);

    const breakpoint = useRef<string | null>(null);

    function sendLayoutChange(updatedLayout: GridLayout.Layout[]) {
        if (breakpoint.current && layoutState[breakpoint.current]) {
            const newLayouts = {
                ...layoutState,
                [breakpoint.current]: updatedLayout
            };
            sendFinalChange(newLayouts);
        }
    }

    const [localLayout, setLocalLayout] = useState(layoutState);

    useEffect(() => {
        if (localLayout !== layoutState) {
            console.log('useLayoutEffect, localLayout sync to serverState', { localLayout, layoutState });
            setLocalLayout(layoutState);
        }
    }, [layoutState]);

    const correctHeight = (itemKey: Key | null) => (element: HTMLDivElement | null) => {
        if (!element || !itemKey || !breakpoint.current) return;
        const { offsetHeight, scrollHeight } = element;
        if (scrollHeight > offsetHeight) {
            const newRowHeight = Math.ceil((scrollHeight + GRID_MARGIN_SIZE) / (GRID_ROW_SIZE + GRID_MARGIN_SIZE));
            setLocalLayout(updateLocalLayout(itemKey, breakpoint.current, newRowHeight));
        }
    }

    function getMinH(itemKey: Key | null) {
        const h = breakpoint.current && layoutState[breakpoint.current].find((item) => item.i === itemKey)?.h;
        return h ? h * GRID_ROW_SIZE + (h - 1) * GRID_MARGIN_SIZE : null;
    }

    function onResizeStop(layout: GridLayout.Layout[], oldItem: GridLayout.Layout, newItem: GridLayout.Layout) {
        const currentLayout = breakpoint.current && layoutState[breakpoint.current];
        if (!currentLayout) return;
        const updatedLayout = currentLayout.map((item) => item.i === newItem.i
            ? { ...item, w: newItem.w, h: newItem.h } : item);
        console.log('resize stop', { updatedLayout });
        sendLayoutChange(updatedLayout);
    }

    function onDragStop(layout: GridLayout.Layout[]) {
        const currentLayout = breakpoint.current && layoutState[breakpoint.current];
        if (!currentLayout) return;
        const updatedLayout = currentLayout.map((currItem) => {
            const updatedItem = layout.find((newItem) => newItem.i === currItem.i);
            return updatedItem ? { ...currItem, x: updatedItem.x, y: updatedItem.y } : currItem;
        });
        console.log('drag stop', { updatedLayout });
        sendLayoutChange(updatedLayout);
    }

    function onBreakpointChange(newBreakpoint: string) {
        console.log('breakpoint change', newBreakpoint);
        breakpoint.current = newBreakpoint;
    }

    console.log('rerender MasonryLayout', { localLayout, layoutState });

    return (
        <ResponsiveGridLayout
            layouts={localLayout}
            className="layout"
            breakpoints={breakpoints}
            cols={cols}
            margin={[GRID_MARGIN_SIZE, GRID_MARGIN_SIZE]}
            rowHeight={GRID_ROW_SIZE}
            onResizeStop={onResizeStop}
            onDragStop={onDragStop}
            onBreakpointChange={onBreakpointChange}
        >
            {children?.map((child) => React.isValidElement(child)
                ? <GridItemWrapper
                    key={child.key}
                    correctHeight={correctHeight(child.key)}
                    minH={getMinH(child.key)}
                    children={child} />
                : null
            )}
        </ResponsiveGridLayout>
    );
}

const updateLocalLayout = (itemKey: Key, currentBp: string, newRowHeight: number) => (prev: GridLayout.Layouts) => {
    const currentLayout = prev[currentBp];
    const currentGridItem = currentLayout?.find((item) => item.i === itemKey);
    if (!currentGridItem || currentGridItem.h === newRowHeight) return prev;
    const updatedLayout = currentLayout.map((item) => ({
        ...item,
        ...item.i === itemKey && { h: newRowHeight }
    }));
    console.log('correctHeight', { itemKey, newRowHeight, updatedLayout });
    return { ...prev, [currentBp]: updatedLayout };
}

export { MasonryLayout };