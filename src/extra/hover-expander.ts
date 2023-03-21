import { createElement as el, MouseEvent, ReactNode, useState } from "react";
import clsx from 'clsx';
import { FlexibleAlign } from "./view-builder/flexible-api";

interface HoverExpanderProps {
    children: ReactNode[]
}

export const useHoverExpander = (needsHoverExpander: boolean, align: FlexibleAlign) => {
    const [hovered, setHovered] = useState<HTMLElement | null>(null);
    let ref = false;

    const getOffset = () => {
        if (!hovered) return;
        const widthDiff = hovered.scrollWidth - hovered.clientWidth;
        if (widthDiff > 0) {
            const { left, right } = hovered.getBoundingClientRect();
            let offset;
            if (align === 'r') {
                offset = widthDiff - left > 0 ? (widthDiff - left) - widthDiff  : -widthDiff;
            }
            else {
                const viewportWidth = hovered.ownerDocument.documentElement.clientWidth;
                offset = right + widthDiff > viewportWidth 
                    ? -widthDiff - 1 : undefined    // account for possible rounding error
            }
            return { translate: offset };
        }
    }
    const hoverStyle = getOffset();

    return needsHoverExpander ? {
        hoverStyle,
        hoverClass: hoverStyle && 'hoverExpander',
        onMouseEnter: (e: MouseEvent<HTMLElement>) => {
            const target = e.currentTarget;
            ref = true;
            setTimeout(() => ref && setHovered(target), 60)
        },
        onMouseLeave: () => {
            ref = false;
            setHovered(null);
        }
    } : {};
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

export const components = { HoverExpander, useHoverExpander }