import { ReactNode, useContext, useLayoutEffect, useMemo } from "react";
import { TitleBarContext } from "./page-title";
import { usePath } from "../../main/vdom-hooks";
import type { Align, LayoutItem } from "../aligned-bars-api";

interface PageTitleBlock {
    identity: object,
    area?: Align,
    priority?: number,
    children?: ReactNode
}

function PageTitleBlock({ identity, area = 'l', priority = 0, children }: PageTitleBlock) {
    const id = usePath(identity);

    const { register, unregister } = useContext(TitleBarContext);

    const pageTitleItem: LayoutItem = useMemo(
        () => ({ id, align: area, priority, render: () => children }),
        [id, area, priority, children]
    );

    useLayoutEffect(
        () => () => unregister?.(pageTitleItem),
        [unregister, id]
    );

    useLayoutEffect(
        () => register?.(pageTitleItem),
        [pageTitleItem, register]
    );

    return null;
}

export { PageTitleBlock }