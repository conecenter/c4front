import React, {createElement as el, CSSProperties, HTMLAttributes, ReactNode} from "react";
import {
  alignSelfStyle,
  FLEXIBLE_CELL_CLASSNAME,
  FLEXIBLE_COLUMN_CLASSNAME,
  FLEXIBLE_GROUPBOX_CLASSNAME,
  FLEXIBLE_ROOT_CLASSNAME,
  FLEXIBLE_ROW_CLASSNAME,
  FlexibleAlign,
  FlexibleSizes, isFill
} from "./flexible-api";
import {provideColumn, provideRow, useFDirectionIsColumn} from "./flexible-direction";

interface FlexibleColumnRootProps {
  key: string,
  children: ReactNode[]
}

function debugBorder(color: string): CSSProperties {
  return {
    border: "2px dashed",
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
  }, provideColumn(children))
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
  }, provideColumn(children))
}

interface FlexibleChildAlign {
  props: {
    align: FlexibleAlign
  }
}

interface FlexibleRowProps {
  key: string
  sizes: FlexibleSizes
  align: FlexibleAlign
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

function FlexibleRow({key, sizes, align, children}: FlexibleRowProps) {
  const separated = separateChildren(children)
  const props: HTMLAttributes<HTMLDivElement> = {
    className: FLEXIBLE_ROW_CLASSNAME,
    style: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      minWidth: `${sizes.min}em`,
      maxWidth: sizes.max && !isFill(align) ? `${sizes.max}em` : undefined,
      ...alignSelfStyle(align),
      ...debugBorder("blue"),
    }
  }
  return provideRow(
    separated.map((list, ind) => wrapInRow(`${key}-${ind}`, props, list))
  )
}

interface FlexibleCellProps {
  key: string
  sizes: FlexibleSizes
  align: FlexibleAlign
  children: ReactNode[]
}

function FlexibleCell({key, sizes, align, children}: FlexibleCellProps) {
  const insideColumn = useFDirectionIsColumn()
  const cellStyles = insideColumn ? {
    minWidth: `${sizes.min}em`,
    maxWidth: sizes.max ? `${sizes.max}em` : undefined,
    ...alignSelfStyle(align),
  } : {
    flexGrow: 1,
    flexBasis: `${sizes.min}em`,
    maxWidth: sizes.max ? `${sizes.max}em` : undefined,
  }
  return el("div", {
    className: FLEXIBLE_CELL_CLASSNAME,
    style: {
      display: "inline-block",
      ...cellStyles,
      ...debugBorder("green"),
    }
  }, children)
}

export const flexibleComponents = {FlexibleColumnRoot, FlexibleColumn, FlexibleGroupbox, FlexibleRow, FlexibleCell}
