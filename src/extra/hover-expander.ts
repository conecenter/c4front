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
            if (childRect.width <= parentRect.width)
                return [{}, false]
            else {
                const width = Math.max(parentRect.width, childRect.width)
                const left = parentRect.left
                const documentRect = hovered.ownerDocument.documentElement.getBoundingClientRect()
                if (documentRect.width > left + width)
                    return [{
                        position: "absolute",
                        width: width,
                        left: left
                    }, true]
                else
                    return [{
                        position: "absolute",
                        width: width,
                        right: documentRect.width - parentRect.right
                    }, true]
            }
        } else
            return [{}, false]
    }

    const [style, needsClass] = calculateStyle()
    const className = classNames && needsClass ? classNames.join(" ") : ""
    if (needsClass)
        return el("div", {},
            [el("div",
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
            ),
                el("div",
                    {
                        className: className,
                        onMouseEnter: (event: MouseEvent<Element>) => setHovered(event.currentTarget),
                        onMouseLeave: () => setHovered(null),
                        style: {visibility: "hidden"}
                    },
                    el("div",
                        {key: "childWrapper", style: {height: "fit-content", width: "fit-content"}},
                        children
                    )
                )]
        )
    else
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
