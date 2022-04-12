import { createElement as el, MouseEvent, ReactNode, useState } from "react";
import clsx from 'clsx';

interface HoverExpanderProps {
    children: ReactNode[]
}

export function HoverExpander({ children }: HoverExpanderProps) {
    const [hovered, setHovered] = useState<Element | null>(null);

    const getStyle = () => {
        if (!hovered || !hovered.parentElement) return;
        const elemRect = hovered.getBoundingClientRect();
        const parentWidth = hovered.parentElement.offsetWidth;
        const widthDiff = elemRect.width - parentWidth;
        if (widthDiff > 0) {
            const viewportWidth = hovered.ownerDocument.documentElement.clientWidth;
            const inlineStyle = elemRect.right > viewportWidth 
                ? { right: Math.round(widthDiff) } : null;
            return ['hoverExpander', inlineStyle];
        }
    }

    const [ className, inlineStyle ] = getStyle() || [null, null];

    return el("div",
        {
            className: clsx('hoverExpanderPassive', className),
            onMouseEnter: (event: MouseEvent<Element>) => setHovered(event.currentTarget),
            onMouseLeave: () => setHovered(null),
            style: inlineStyle
        },
        children
    );
}

export const components = { HoverExpander }