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
        const widthDiff = Math.round(elemRect.width - parentWidth);
        if (widthDiff > 0) {
            const viewportWidth = hovered.ownerDocument.documentElement.clientWidth;
            const viewportOverflow = Math.round(elemRect.right) > viewportWidth
                ? widthDiff 
                : Math.round(elemRect.left) < 0 ? Math.round(elemRect.left) : undefined;
            const inlineStyle = { right: viewportOverflow };
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