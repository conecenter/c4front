import { ReactNode } from "react";

type Align = 'l' | 'c' | 'r';
type Id = string;

interface WithId {
    id: Id
}

interface LayoutItem extends WithId {
    align: Align,
    priority: number,
    render: () => ReactNode
}

interface LayoutBarContext {
    register?: (item: LayoutItem) => void,
    unregister?: (item: LayoutItem) => void
}

const ALIGN_VALS = ['l', 'c', 'r'] as const;

const sortByPriority = (items: LayoutItem[]) => items.sort((a, b) => b.priority - a.priority);

const filterByAlign = (items: LayoutItem[], align: Align) => items.filter(i => i.align === align);

export type { Align, Id, WithId, LayoutItem, LayoutBarContext };
export { ALIGN_VALS, sortByPriority, filterByAlign };