import { useContext, useLayoutEffect, useMemo } from "react";
import { PageTitleContext } from "./page-title-provider";
import { usePath } from "../../main/vdom-hooks";
import type { LayoutItem } from "../aligned-bars-api";
import { PageTitleBlockProps } from "types/c4gen.FrontTags";

function PageTitleBlock({ identity, area = 'l', priority = 0, children }: PageTitleBlockProps) {
    const id = usePath(identity);

    const { register, unregister } = useContext(PageTitleContext);

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