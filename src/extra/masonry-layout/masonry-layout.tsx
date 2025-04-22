import React, { Key, ReactElement, useMemo, useRef, useState } from "react";
import GridLayout, { Responsive, WidthProvider } from 'react-grid-layout';
import clsx from "clsx";
import { Patch, usePatchSync } from "../exchange/patch-sync";
import { GridItemWrapper } from "./grid-item";
import { identityAt } from "../../main/vdom-util";

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
        if (breakpoint && layoutState[breakpoint]) {
            const newLayouts = {
                ...layoutState,
                [breakpoint]: updatedLayout
            };
            console.log('MasonryLayout: sendLayoutChange', { newLayouts });
            sendFinalChange(newLayouts);
        }
    }

    const [localLayout, setLocalLayout] = useState(layoutState);

    const layoutStateJson = JSON.stringify(layoutState);
    useMemo(() => {
        if (JSON.stringify(localLayout) !== layoutStateJson) {
            console.log('useMemo - CHANGED LAYOUTSTATE', { localLayout, layoutState });
            setLocalLayout(layoutState);
        }
    }, [layoutStateJson]);

    console.log('RENDER', { layoutServerState, layoutState, localLayout, breakpoint });

    const correctHeight = (itemKey: Key | null) => (element: HTMLDivElement | null) => {
        if (!element || !itemKey || !breakpoint || isDragging || isResizingRef.current) return;
        const { clientHeight, scrollHeight } = element;
        if (scrollHeight > clientHeight) {
            console.log('CORRECT HEIGHT', { itemKey, scrollHeight, clientHeight });
            const newRowHeight = Math.ceil((scrollHeight + GRID_MARGIN_SIZE) / (GRID_ROW_SIZE + GRID_MARGIN_SIZE));
            setLocalLayout(updateLocalLayout(itemKey, breakpoint, newRowHeight));
        }
    }

    function getMinH(itemKey: Key | null) {
        const h = breakpoint && layoutState[breakpoint]?.find((item) => item.i === itemKey)?.h;
        return h ? h * GRID_ROW_SIZE + (h - 1) * GRID_MARGIN_SIZE : null;
    }

    function onResizeStop(layout: GridLayout.Layout[], oldItem: GridLayout.Layout, newItem: GridLayout.Layout) {
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
    );
}

function useBreakpoint(breakpoints: { [P: string]: number }) {
    const [breakpoint, setBreakpoint] = useState<string | null>(null);
    const onWidthChange = (containerWidth: number) => {
        if (!breakpoint) {
            const sortedBreakpoints = Object.entries(breakpoints).sort((a, b) => b[1] - a[1]);
            const newBreakpoint = sortedBreakpoints.find(([_, width]) => containerWidth > width)?.[0];
            newBreakpoint && setBreakpoint(newBreakpoint);
        }
    }
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
    children: ReactElement[] = []
): GridLayout.Layouts {
    const bps = Object.keys(breakpoints);
    console.log('getAlignedLayout', { layoutServerState, breakpoints, children });
    const alignedLayout = children?.reduce<GridLayout.Layouts>((alignedLayout, child) => {
        bps.forEach((bp) => {
            const savedItemLayout = layoutServerState[bp]?.find((item) => item.i === child.key);
            alignedLayout[bp] = [...(alignedLayout[bp] || []), savedItemLayout || getDefaultItemLayout(child.key as string, bp)];
        });
        return alignedLayout;
    }, {});
    if (JSON.stringify(alignedLayout) !== JSON.stringify(layoutServerState)) {
        console.log('send alignedLayout to server', { alignedLayout, layoutServerState });
        sendFinalChange(alignedLayout);
    }
    return alignedLayout;
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