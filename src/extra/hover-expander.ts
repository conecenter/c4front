import {createElement as el, MouseEvent, ReactNode, useState} from "react";

interface HoverExpanderProps {
    classNames: string[],
    children: ReactNode[]
}

export function HoverExpander({classNames, children}: HoverExpanderProps) {
    const [hovered, setHovered] = useState<Element | null>(null);

    function calculateStyle() {
        if (hovered !== null) {
            // @ts-ignore
            const parentRect = hovered.parentElement.getBoundingClientRect()
            const childRect = hovered.children[0].getBoundingClientRect()
            if (childRect.width < parentRect.width)
                return [{height: "100%", width: "100%"}, false]
            else {
                const height = Math.max(parentRect.height, childRect.height)
                const width = Math.max(parentRect.width, childRect.width)
                const top = parentRect.top
                const left = parentRect.left
                const documentRect = hovered.ownerDocument.documentElement.getBoundingClientRect()
                if (documentRect.width > left + width)
                    return [{
                        position: "absolute",
                        height: height,
                        width: width,
                        top: top,
                        left: left
                    }, true]
                else
                    return [{
                        position: "absolute",
                        height: height,
                        width: width,
                        top: top,
                        left: documentRect.width - width - (documentRect.width - parentRect.right)
                    }, true]
            }
        } else
            return [{height: "100%", width: "100%"}, false]
    }

    const [style, needsClass] = calculateStyle()
    const className = classNames && needsClass ? classNames.join(" ") : ""
    return el("div",
        {
            className: className,
            onMouseEnter: (event: MouseEvent<Element>) => setHovered(event.currentTarget),
            onMouseLeave: () => setHovered(null),
            style: style
        },
        el("div",
            {key: "childWrapper", style: {height: "fit-content", width: "fit-content"}},
            children
        )
    )
}

export const components = {HoverExpander}