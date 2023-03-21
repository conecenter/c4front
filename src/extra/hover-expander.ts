import { MouseEvent, useState } from "react";
import { FlexibleAlign } from "./view-builder/flexible-api";

export const useHoverExpander = (align: FlexibleAlign, needsHoverExpander: boolean) => {
    const [hovered, setHovered] = useState<HTMLElement | null>(null);
    let needAction = false;

    const onMouseEnter = (e: MouseEvent<HTMLElement>) => {
        const target = e.currentTarget;
        needAction = true;
        setTimeout(() => needAction && setHovered(target), 50)
    }

    const onMouseLeave = () => {
        needAction = false;
        setHovered(null);
    }

    const getOffset = () => {
        if (!hovered) return;
        const widthDiff = hovered.scrollWidth - hovered.clientWidth;
        if (widthDiff <= 0) return;
        const { left, right } = hovered.getBoundingClientRect();
        let offset;
        if (align === 'r') offset = widthDiff - left > 0 ? -left : -widthDiff;
        else {
            const viewportWidth = hovered.ownerDocument.documentElement.clientWidth;
            offset = right + widthDiff > viewportWidth
                ? -widthDiff - 1 : undefined    // account for possible rounding error
        }
        return { translate: offset };
    }
    
    const hoverStyle = getOffset();

    return needsHoverExpander ? {
        hoverStyle,
        hoverClass: hoverStyle && 'hoverExpander',
        onMouseEnter,
        onMouseLeave
    } : {};
}