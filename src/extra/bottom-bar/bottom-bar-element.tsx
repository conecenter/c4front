import { ReactNode, useContext, useLayoutEffect, useMemo } from "react";
import { BottomBarContext } from "./bottom-bar-manager";
import type { Align, Id, LayoutItem } from "../aligned-bars-api";

interface BottomBarElement {
    id: Id,
    align?: Align,
    priority?: number,
    children?: ReactNode
}

function BottomBarElement({ id, align = 'l', priority = 0, children }: BottomBarElement) {
    const { register, unregister } = useContext(BottomBarContext);

    const bottomBarItem: LayoutItem = useMemo(
        () => ({ id, align, priority, render: () => children }),
        [id, align, priority, children]
    );

    useLayoutEffect(
        () => () => unregister?.(bottomBarItem),
        [unregister, id]
    );

    useLayoutEffect(
        () => register?.(bottomBarItem),
        [bottomBarItem, register]
    );

    return null;
}

export { BottomBarElement }