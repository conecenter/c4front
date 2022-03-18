import React, {createElement as el, CSSProperties, HTMLAttributes, ReactNode} from "react";
import {
  FLEXIBLE_CELL_CLASSNAME,
  FLEXIBLE_COLUMN_CLASSNAME,
  FLEXIBLE_GROUPBOX_CLASSNAME,
  FLEXIBLE_LABELED_CHILD_CLASSNAME,
  FLEXIBLE_LABELED_CLASSNAME,
  FLEXIBLE_LABELED_LABEL_CLASSNAME,
  FLEXIBLE_ROOT_CLASSNAME,
  FLEXIBLE_ROW_CLASSNAME,
  FlexibleAlign,
  FlexibleSizes
} from "./flexible-api";

interface FlexibleColumnRootProps {
  key: string,
  children: ReactNode[]
}

function debugBorder(color: string): CSSProperties {
  return {
    border: "2px solid",
    borderColor: color,
  }
}

function FlexibleColumnRoot({key, children}: FlexibleColumnRootProps) {
  return el("div", {
    className: FLEXIBLE_ROOT_CLASSNAME,
    style: {
      width: "100%",
    }
  }, children)
}

interface FlexibleColumnProps {
  key: string
  sizes: FlexibleSizes
  align: FlexibleAlign
  children: ReactNode[]
}

function FlexibleColumn({key, sizes, children}: FlexibleColumnProps) {
  return el("div", {
    className: FLEXIBLE_COLUMN_CLASSNAME,
    style: {
      display: "flex",
      flexGrow: 1,
      flexDirection: "column",
      flexBasis: `${sizes.min}em`,
      minWidth: `${sizes.min}em`,
      maxWidth: sizes.max ? `${sizes.max}em` : undefined,
      maxHeight: "fit-content",
      ...debugBorder("red"),
    }
  }, children)
}

interface FlexibleGroupboxProps {
  key: string
  sizes: FlexibleSizes
  align: FlexibleAlign
  children: ReactNode[]
}

function FlexibleGroupbox({key, sizes, children}: FlexibleGroupboxProps) {
  return el("div", {
    className: FLEXIBLE_GROUPBOX_CLASSNAME,
    style: {
      display: "flex",
      flexGrow: 1,
      flexDirection: "column",
      flexBasis: `${sizes.min}em`,
      minWidth: `${sizes.min}em`,
      maxWidth: sizes.max ? `${sizes.max}em` : undefined,
      maxHeight: "fit-content",
      ...debugBorder("orange"),
    }
  }, children)
}

interface FlexibleChildAlign {
  props: {
    align: FlexibleAlign
  }
}

interface FlexibleRowProps {
  key: string
  sizes: FlexibleSizes
  children: (ReactNode & FlexibleChildAlign)[]
}

function correctNext(prev: FlexibleAlign, next: FlexibleAlign): boolean {
  switch (prev) {
    case "l":
      return true
    case "c":
      return next !== "l"
    case "r":
      return next !== "l" && next !== "c"
    default:
      return true
  }
}

const spacer = el("div", {style: {marginLeft: "auto", marginRight: "auto"}})

function separateChildren(children: (ReactNode & FlexibleChildAlign)[]): React.ReactNode[][] {
  const childrenArray = React.Children.toArray(children) as (ReactNode & FlexibleChildAlign)[]
  const newChildren = [[]] as ReactNode[][]
  let currentAlign: FlexibleAlign = "l"
  let currentInd = 0
  for (const elem of childrenArray) {
    const newAlign = elem.props.align
    if (currentAlign === newAlign || newAlign === 'f')
      newChildren[currentInd].push(elem)
    else {
      if (correctNext(currentAlign, newAlign))
        newChildren[currentInd].push(spacer, elem)
      else {
        currentInd++
        newChildren.push([elem])
      }
      currentAlign = newAlign
    }
  }
  return newChildren
}

function wrapInRow(key: string, props: HTMLAttributes<HTMLDivElement>, children: ReactNode[]) {
  return el("div", props, children)
}

function FlexibleRow({key, sizes, children}: FlexibleRowProps) {
  const separated = separateChildren(children)
  const props: HTMLAttributes<HTMLDivElement> = {
    className: FLEXIBLE_ROW_CLASSNAME,
    style: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      minWidth: `${sizes.min}em`,
      maxWidth: sizes.max ? `${sizes.max}em` : undefined,
      ...debugBorder("blue"),
    }
  }
  return separated.map((list, ind) => wrapInRow(`${key}-${ind}`, props, list))
}

interface FlexibleCellProps {
  key: string
  sizes: FlexibleSizes
  children: ReactNode[]
}

function FlexibleCell({key, sizes, children}: FlexibleCellProps) {
  return el("div", {
    className: FLEXIBLE_CELL_CLASSNAME,
    style: {
      display: "inline-block",
      flexGrow: 1,
      flexBasis: `${sizes.min}em`,
      maxWidth: sizes.max ? `${sizes.max}em` : undefined,
      ...debugBorder("green"),
    }
  }, children)
}

interface FlexibleLabeledProps {
  key: string
  sizes: FlexibleSizes
  label: string
  labelChildren: ReactNode[]
  children: ReactNode[]
  horizontal?: boolean
}

function FlexibleLabeled({sizes, label, labelChildren, children, horizontal}: FlexibleLabeledProps) {
  return el("div", {
      className: FLEXIBLE_LABELED_CLASSNAME,
      style: {
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        flexGrow: 1,
        flexBasis: `${sizes.min}em`,
        maxWidth: sizes.max ? `${sizes.max}em` : undefined,
        ...debugBorder("yellow"),
      }
    },
    el("label", {
      className: FLEXIBLE_LABELED_LABEL_CLASSNAME,
      style: {
        fontSize: "0.8em",
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center"
      }
    }, el("span", {}, label), labelChildren),
    el("div", {
      className: FLEXIBLE_LABELED_CHILD_CLASSNAME,
      style: {
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center"
      }
    }, children)
  )
}

export const flexibleComponents = {FlexibleColumnRoot, FlexibleColumn, FlexibleGroupbox, FlexibleRow, FlexibleCell, FlexibleLabeled}
