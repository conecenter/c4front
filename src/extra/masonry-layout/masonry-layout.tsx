import React, { Key, ReactNode, useEffect, useState } from "react";
import GridLayout, { Responsive, WidthProvider } from 'react-grid-layout';
import clsx from "clsx";
import { Patch, usePatchSync } from "../exchange/patch-sync";
import { GridItemWrapper } from "./grid-item";
import { identityAt } from "../../main/vdom-util";

const GRID_ROW_SIZE = 10;
const GRID_MARGIN_SIZE = 10;

const receiverIdOf = identityAt('receiver');

const serverToState = (s?: string): GridLayout.Layouts => s ? JSON.parse(s) : [];
const changeToPatch = (ch: GridLayout.Layouts): Patch => ({ value: JSON.stringify(ch) });
const patchToChange = (p: Patch): GridLayout.Layouts => JSON.parse(p.value);
const applyChange = (prev: GridLayout.Layouts, ch: GridLayout.Layouts) => ch;
const patchSyncTransformers = { serverToState, changeToPatch, patchToChange, applyChange };

const ResponsiveGridLayout = WidthProvider(Responsive);

interface MasonryLayout {
    identity: object,
    layout?: string,
    breakpoints: { [P: string]: number },
    cols: { [P: string]: number },
    edit: boolean,
    children?: ReactNode[]
}

function MasonryLayout({ identity, layout: layoutJSON, breakpoints, cols, edit, children }: MasonryLayout) {
    const { currentState: layoutState, sendFinalChange } =
        usePatchSync(receiverIdOf(identity), layoutJSON, false, patchSyncTransformers);

    const [breakpoint, setBreakpoint] = useState<string | null>(null);

    const [isDragging, setIsDragging] = useState(false);

    function sendLayoutChange(updatedLayout: GridLayout.Layout[]) {
        if (breakpoint && layoutState[breakpoint]) {
            const newLayouts = {
                ...layoutState,
                [breakpoint]: updatedLayout
            };
            sendFinalChange(newLayouts);
        }
    }

    const [localLayout, setLocalLayout] = useState(layoutState);

    useEffect(() => {
        if (localLayout !== layoutState) setLocalLayout(layoutState);
    }, [edit ? layoutState : layoutJSON, breakpoint]);

    const correctHeight = (itemKey: Key | null) => (element: HTMLDivElement | null) => {
        if (!element || !itemKey || !breakpoint) return;
        const { clientHeight, scrollHeight } = element;
        if (scrollHeight > clientHeight) {
            const newRowHeight = Math.ceil((scrollHeight + GRID_MARGIN_SIZE) / (GRID_ROW_SIZE + GRID_MARGIN_SIZE));
            setLocalLayout(updateLocalLayout(itemKey, breakpoint, newRowHeight));
        }
    }

    function getMinH(itemKey: Key | null) {
        const h = breakpoint && layoutState[breakpoint].find((item) => item.i === itemKey)?.h;
        return h ? h * GRID_ROW_SIZE + (h - 1) * GRID_MARGIN_SIZE : null;
    }

    function onResizeStop(layout: GridLayout.Layout[], oldItem: GridLayout.Layout, newItem: GridLayout.Layout) {
        const currentLayout = breakpoint && layoutState[breakpoint];
        if (!currentLayout) return;
        const updatedLayout = currentLayout.map((item) => item.i === newItem.i
            ? { ...item, w: newItem.w, h: newItem.h } : item);
        sendLayoutChange(updatedLayout);
    }

    function onDragStop(layout: GridLayout.Layout[]) {
        const currentLayout = breakpoint && layoutState[breakpoint];
        if (!currentLayout) return;
        const updatedLayout = currentLayout.map((currItem) => {
            const updatedItem = layout.find((newItem) => newItem.i === currItem.i);
            return updatedItem ? { ...currItem, x: updatedItem.x, y: updatedItem.y } : currItem;
        });
        setIsDragging(false);
        sendLayoutChange(updatedLayout);
    }

    return (
        <ResponsiveGridLayout
            layouts={localLayout}
            className={clsx('layout', isDragging && 'isDragging', edit && 'editMode')}
            breakpoints={breakpoints}
            cols={cols}
            margin={[GRID_MARGIN_SIZE, GRID_MARGIN_SIZE]}
            rowHeight={GRID_ROW_SIZE}
            onResizeStop={onResizeStop}
            onDragStop={onDragStop}
            onDragStart={() => setIsDragging(true)}
            onBreakpointChange={setBreakpoint}
            isDraggable={edit ? true : false}
            isResizable={edit ? true : false}
        >
            {children?.map((child) => {
                if (!React.isValidElement(child)) return null;
                const { gridId } = child.props;
                if (!gridId) {
                    console.error('MasonryLayout: child must have gridId prop');
                    return null;
                }
                return <GridItemWrapper
                    key={gridId}
                    correctHeight={correctHeight(gridId)}
                    minH={edit ? getMinH(gridId) : null}
                    children={child} />
            })}
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
    return { ...prev, [currentBp]: updatedLayout };
}

export { MasonryLayout };