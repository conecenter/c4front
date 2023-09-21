import { MutableRefObject, useContext, useEffect, useMemo, useState } from "react";
import { useAddEventListener } from "./custom-hooks";
import { PathContext } from "./focus-control";
import { FlexibleAlign } from "./view-builder/flexible-api";

export const useHoverExpander = (
    path: string,
    ref: MutableRefObject<HTMLDivElement | null>,
    align: FlexibleAlign,
    needsHoverExpander: boolean
) => {
    const [hovered, setHovered] = useState<HTMLElement | null>(null);
    let needAction = false;

    // Hover when focus inside the cell
    const currentPath = useContext(PathContext);
    const focusInside = currentPath.includes(path);
    useEffect(() => {
        if (focusInside && !hovered) setHovered(ref.current);
        else if (!focusInside && hovered) setHovered(null);
    }, [focusInside]);

    const onMouseEnter = () => {
        needAction = true;
        setTimeout(() => needAction && setHovered(ref.current), 50);
    }

    const onMouseLeave = () => {
        if (focusInside) return;
        needAction = false;
        setHovered(null);
    }

    // Touch functionality
    const doc = ref.current?.ownerDocument;
    const onTouchStart = (e: TouchEvent) => {
        if (ref.current?.contains(e.target as Node) && !hovered) setHovered(ref.current);
        else if (!ref.current?.contains(e.target as Node) && hovered && !focusInside) setHovered(null);
    }
    useAddEventListener(doc, 'touchstart', onTouchStart);

    // Offset calculation
    const getOffset = () => {
        if (!hovered) return;
        const widthDiff = hovered.scrollWidth - hovered.clientWidth;
        if (widthDiff <= 0) return;
        const { left, right } = hovered.getBoundingClientRect();
        let offset;
        if (align === 'r') offset = widthDiff - left > 0 ? -left : -widthDiff - 1;
        else {
            const viewportWidth = hovered.ownerDocument.documentElement.clientWidth;
            offset = right + widthDiff <= viewportWidth
                ? undefined : left - widthDiff >= 0
                    ? -widthDiff - 1 : viewportWidth - hovered.scrollWidth < 0
                        ? -left : viewportWidth - (right + widthDiff + 1)   // +/-1 accounts for possible rounding error
        }
        return { translate: offset };
    }
    
    const hoverStyle = useMemo(() => getOffset(), [hovered]);

    return needsHoverExpander ? {
        hoverStyle,
        hoverClass: hoverStyle && 'hoverExpander',
        onMouseEnter,
        onMouseLeave
    } : {};
}