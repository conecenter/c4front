import React, { Key, ReactElement, useEffect, useRef, useState } from "react";
import GridLayout, { Responsive, WidthProvider } from 'react-grid-layout';
import clsx from "clsx";
import { Patch, usePatchSync } from "../exchange/patch-sync";
import { GridItemWrapper } from "./grid-item";
import { identityAt } from "../../main/vdom-util";

const GRID_ROW_SIZE = 10;
const GRID_MARGIN_SIZE = 10;
const DEFAULT_COL_H = 4;

const receiverIdOf = identityAt('receiver');

const serverToState = (s: string): GridLayout.Layouts | null => s ? JSON.parse(s) : null;
const changeToPatch = (ch: GridLayout.Layouts): Patch => ({ value: JSON.stringify(ch) });
const patchToChange = (p: Patch): GridLayout.Layouts => JSON.parse(p.value);
const applyChange = (prev: GridLayout.Layouts | null, ch: GridLayout.Layouts) => ch;
const patchSyncTransformers = { serverToState, changeToPatch, patchToChange, applyChange };

const ResponsiveGridLayout = WidthProvider(Responsive);

interface MasonryLayout {
    identity: object,
    layout: string,
    breakpoints: { [P: string]: number },
    cols: { [P: string]: number },
    edit: boolean,
    children: ReactElement[]
}

function MasonryLayout({ identity, layout: layoutJSON, breakpoints, cols, edit, children }: MasonryLayout) {
    const { currentState: layoutServerState, sendFinalChange } =
        usePatchSync(receiverIdOf(identity), layoutJSON, false, patchSyncTransformers);
    
    const layoutState = useDefaultLayout(layoutServerState, breakpoints, children, cols, sendFinalChange);

    const [breakpoint, setBreakpoint] = useState<string | null>(null);

    const [isDragging, setIsDragging] = useState(false);

    const isResizingRef = useRef(false);

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
        if (JSON.stringify(localLayout) !== JSON.stringify(layoutState)) {
            console.log('useEffect', { localLayout, layoutState });
            setLocalLayout(layoutState);
        }
    }, [JSON.stringify(layoutState), breakpoint]);   // change from useEffect?

    console.log('RENDER', { layoutServerState, layoutState, localLayout, breakpoint });

    const correctHeight = (itemKey: Key | null) => (element: HTMLDivElement | null) => {
        if (!element || !itemKey || !breakpoint || isDragging || isResizingRef.current) return;
        const { clientHeight, scrollHeight } = element;
        console.log('CORRECT HEIGHT', { itemKey, scrollHeight, clientHeight });
        if (scrollHeight > clientHeight) {
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
            onBreakpointChange={setBreakpoint}
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

function useDefaultLayout(
    layoutServerState: GridLayout.Layouts | null,
    breakpoints: { [P: string]: number },
    children: ReactElement[],
    cols: { [P: string]: number },
    sendFinalChange: (layout: GridLayout.Layouts) => void
) {
    const checkApplyDefaultLayout = () => {
        if (layoutServerState) return layoutServerState;
        const newLayouts = createDefaultLayout(breakpoints, children, cols);
        sendFinalChange(newLayouts);
        return newLayouts;
    }
    return checkApplyDefaultLayout();
}

function createDefaultLayout(breakpoints: { [P: string]: number }, children: ReactElement[], cols: { [P: string]: number }): GridLayout.Layouts {
    const bps = Object.keys(breakpoints);
    const childrenKeys = children.map((child) => child.key as string | null);
    return bps.reduce<GridLayout.Layouts>((acc, bp) => {
        const isSmallScreen = ['sm', 'xs'].includes(bp);
        acc[bp] = childrenKeys.map((key, index) => {
            const minW = isSmallScreen ? 1 : 2;
            const posX = index * minW;
            return {
                i: key ?? `item-${index}`,
                x: posX % cols[bp],
                y: Math.trunc(posX / cols[bp]) * DEFAULT_COL_H, 
                w: minW,
                h: DEFAULT_COL_H,
                minW
            }
        });
        return acc;
    }, {});
}

const updateLocalLayout = (itemKey: Key, currentBp: string, newRowHeight: number) => (prev: GridLayout.Layouts) => {
    const currentLayout = prev[currentBp];
    const currentGridItem = currentLayout?.find((item) => item.i === itemKey);
    if (!currentGridItem || currentGridItem.h === newRowHeight) return prev;
    console.log('UPDATE LOCAL LAYOUT', { ...prev, currentGridItem, newRowHeight });
    const updatedLayout = currentLayout.map((item) => ({
        ...item,
        ...item.i === itemKey && { h: newRowHeight }
    }));
    return { ...prev, [currentBp]: updatedLayout };
}

export { MasonryLayout };