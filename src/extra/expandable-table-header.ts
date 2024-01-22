import {createElement as el, MouseEvent, ReactNode, useState} from "react";

interface TableHeaderProps {
  title: string,
  hoverClassNames?: string[],
  shortTitle?: string,
  children?: ReactNode[]
}

function calculateHoverStyle(parentRect: DOMRect, childRect: DOMRect, documentRect: DOMRect) {
  const height = Math.max(parentRect.height, childRect.height)
  const top = parentRect.top
  const left = parentRect.left
  const width = childRect.width
  if (documentRect.width > left + width)
    return {
      position: "fixed",
      height: height,
      width: width,
      top: top,
      left: left
    }
  else
    return {
      position: "fixed",
      height: height,
      width: width,
      top: top,
      left: documentRect.width - width - (documentRect.width - parentRect.right)
    }
}

function getTitle(title: string) {
  return el("div", {
      key: "title",
      style: {minWidth: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "clip"}
    },
    el("span", {}, title)
  )
}

export function ExpandableTableHeader({title, hoverClassNames, shortTitle, children}: TableHeaderProps) {
  const [elem, setElem] = useState<Element | null>(null)
  const [hovered, setHovered] = useState<boolean>(false)


  function calculateStyle(): [object | null, boolean, boolean, number | null] {
    if (elem !== null) {
      const parentRect = elem.parentElement!.getBoundingClientRect()
      const childRect = elem.children[1].getBoundingClientRect()
      const needsHover = childRect.width > parentRect.width
      if (needsHover) {
        if (hovered) {
          const hoverStyle = calculateHoverStyle(parentRect, childRect, elem.ownerDocument.documentElement.getBoundingClientRect())
          return [hoverStyle, true, true, parentRect.width]
        } else {
          return [null, false, true, parentRect.width]
        }
      } else return [null, true, false, parentRect.width]
    } else return [null, true, false, null]
  }

  const [style, useFullTitle, needsHover, parentWidth] = calculateStyle()
  const className = hoverClassNames && hovered && style !== null ? hoverClassNames.join(" ") : ""
  const drawTitle = !useFullTitle && shortTitle ? shortTitle : title
  const widthStyle = parentWidth && (!hovered || !needsHover) ? parentWidth + "px" : "fit-content"
  const prepareChildren = children ? children : []
  return el(
    "div",
    {
      className: className,
      ref: setElem,
      onMouseEnter: (event: MouseEvent<Element>) => setHovered(true),
      onMouseLeave: () => setHovered(false),
      style: style
    },
    [
      el(
        "div",
        {
          key: "childWrapper",
          className: "tableHeaderWrapper",
          style: {height: "fit-content", width: widthStyle, display: "flex"}
        },
        [getTitle(drawTitle), ...prepareChildren]
      ),
      el(
        "div",
        {
          key: "childWrapper-hidden",
          className: "tableHeaderWrapper",
          style: {position: "fixed", height: "fit-content", width: "fit-content", display: "flex", visibility: "hidden"}
        },
        [getTitle(title), ...prepareChildren]
      )
    ]
  )
}

export const components = {ExpandableTableHeader}
