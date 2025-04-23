import React, { Key, ReactElement, useMemo, useRef, useState } from "react";
import GridLayout, { Responsive, WidthProvider } from 'react-grid-layout';
import equal from "fast-deep-equal";
import clsx from "clsx";
import { Patch, usePatchSync } from "../exchange/patch-sync";
import { GridItemWrapper } from "./grid-item";
import { identityAt } from "../../main/vdom-util";
import { BreakpointsDisplay } from "./breakpoints-display";

type JSONString = string

const GRID_ROW_SIZE = 10;
const GRID_MARGIN_SIZE = 10;

const receiverIdOf = identityAt('receiver');

const serverToState = (s: JSONString): GridLayout.Layouts => s ? JSON.parse(s) : {};
const changeToPatch = (ch: GridLayout.Layouts): Patch => ({ value: JSON.stringify(ch) });
const patchToChange = (p: Patch): GridLayout.Layouts => JSON.parse(p.value);
const applyChange = (_prev: GridLayout.Layouts | null, ch: GridLayout.Layouts) => ch;
const patchSyncTransformers = { serverToState, changeToPatch, patchToChange, applyChange };

const ResponsiveGridLayout = WidthProvider(Responsive);

interface MasonryLayout {
    identity: object,
    layout: JSONString,
    breakpoints: { [P: string]: number },
    cols: { [P: string]: number },
    edit: boolean,
    children?: ReactElement[]
}

function MasonryLayout({ identity, layout, breakpoints, cols, edit, children }: MasonryLayout) {
    const { currentState: layoutServerState, sendFinalChange } =
        usePatchSync(receiverIdOf(identity), layout, false, patchSyncTransformers);
    
    const layoutState = edit ? getAlignedLayout(layoutServerState, breakpoints, sendFinalChange, children) : layoutServerState;

    const { breakpoint, onBreakpointChange, onWidthChange } = useBreakpoint(breakpoints);

    const [isDragging, setIsDragging] = useState(false);
    const isResizingRef = useRef(false);

    function sendLayoutChange(updatedLayout: GridLayout.Layout[]) {
        if (breakpoint) {
            const newLayouts = { ...layoutState, [breakpoint]: updatedLayout };
            if (equal(layoutState[breakpoint], updatedLayout)) setLocalLayout(newLayouts);
            else sendFinalChange(newLayouts);
        }
    }

    // Local layout to correct real height of grid items based on content
    const [localLayout, setLocalLayout] = useState(layoutState);

    useMemo(function alignLocalLayoutWithServer() {
        if (!equal(localLayout, layoutState)) setLocalLayout(layoutState);
    }, [JSON.stringify(layoutState)]);

    const correctHeight = (itemKey: Key | null) => (element: HTMLDivElement | null) => {
        if (!element || !itemKey || !breakpoint || isDragging || isResizingRef.current) return;
        const { clientHeight, scrollHeight } = element;
        if (scrollHeight > clientHeight) {
            const newRowHeight = Math.ceil((scrollHeight + GRID_MARGIN_SIZE) / (GRID_ROW_SIZE + GRID_MARGIN_SIZE));
            setLocalLayout(updateLocalLayout(itemKey, breakpoint, newRowHeight));
        }
    }

    function getMinH(itemKey: Key | null) {
        const h = breakpoint && layoutState[breakpoint]?.find((item) => item.i === itemKey)?.h;
        return h ? h * GRID_ROW_SIZE + (h - 1) * GRID_MARGIN_SIZE : null;
    }

    function onResizeStop(_layout: GridLayout.Layout[], _oldItem: GridLayout.Layout, newItem: GridLayout.Layout) {
        isResizingRef.current = false;
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
        <>
            {edit && <BreakpointsDisplay breakpoints={breakpoints} currentBp={breakpoint} />}

            <ResponsiveGridLayout
                layouts={localLayout}
                autoSize={true}
                className={clsx('layout', isDragging && 'isDragging', edit && 'editMode')}
                breakpoints={breakpoints}
                cols={cols}
                margin={[GRID_MARGIN_SIZE, GRID_MARGIN_SIZE]}
                rowHeight={GRID_ROW_SIZE}
                onResizeStart={() => isResizingRef.current = true}
                onResizeStop={onResizeStop}
                onDragStop={onDragStop}
                onDragStart={() => setIsDragging(true)}
                onBreakpointChange={onBreakpointChange}
                onWidthChange={onWidthChange}
                isDraggable={edit ? true : false}
                isResizable={edit ? true : false}
            >
                {children?.map((child) => {
                    if (!React.isValidElement(child)) return null;
                    const key = child.key;
                    if (!key) {
                        console.error('MasonryLayout: child must have a key prop');
                        return null;
                    }
                    return <GridItemWrapper
                        key={key}
                        correctHeight={correctHeight(key)}
                        minH={edit ? getMinH(key) : null}
                        children={child} />
                })}
            </ResponsiveGridLayout>
        </>    
    );
}

function useBreakpoint(breakpoints: { [P: string]: number }) {
    const [breakpoint, setBreakpoint] = useState<string | null>(null);
    const onWidthChange = (containerWidth: number) => setBreakpoint((prev) => {
        if (prev) return prev;
        const sortedBreakpoints = Object.entries(breakpoints).sort((a, b) => b[1] - a[1]);
        const newBreakpoint = sortedBreakpoints.find(([_, width]) => containerWidth > width)?.[0];
        return newBreakpoint || null;
    });
    const onBreakpointChange = (newBreakpoint: string) => setBreakpoint(newBreakpoint);
    return { breakpoint, onBreakpointChange, onWidthChange };
}

const getDefaultItemLayout = (key: string, bp: string): GridLayout.Layout => {
    const minW = ['sm', 'xs'].includes(bp) ? 1 : 2;
    return { i: key, x: 0, y: 0, w: minW, h: 5, minW }
}

export function getAlignedLayout(
    layoutServerState: GridLayout.Layouts,
    breakpoints: { [P: string]: number },
    sendFinalChange: (layout: GridLayout.Layouts) => void,
    children?: ReactElement[]
): GridLayout.Layouts {
    if (!children) return {};
    const bps = Object.keys(breakpoints);
    const childrenKeys = children.map((child) => child.key);
    const alignedLayout = bps.reduce<GridLayout.Layouts>((alignedLayout, bp) => {
        alignedLayout[bp] = childrenKeys.map((key) =>
            layoutServerState[bp]?.find((item) => item.i === key) || getDefaultItemLayout(key as string, bp));
        return alignedLayout;
    }, {});
    if (!equal(alignedLayout, layoutServerState)) sendFinalChange(alignedLayout);
    return alignedLayout;
}

const updateLocalLayout = (itemKey: Key, currentBp: string, newRowHeight: number) => (prev: GridLayout.Layouts) => {
    const currentLayout = prev[currentBp];
    const currentGridItem = currentLayout?.find((item) => item.i === itemKey);
    if (!currentGridItem || currentGridItem.h === newRowHeight) return prev;
    const updatedLayout = currentLayout.map((item) => item.i === itemKey ? { ...item, h: newRowHeight } : item);
    return { ...prev, [currentBp]: updatedLayout };
}

export { MasonryLayout };