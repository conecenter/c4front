import React, {createElement as el, CSSProperties, HTMLAttributes, ReactNode} from "react";
import {
  FlexibleAlign,
  FlexibleSizes
} from "./flexible-api";
import {
  FLEXIBLE_ACCENTED_GROUPBOX_CLASSNAME,
  FLEXIBLE_CELL_CLASSNAME,
  FLEXIBLE_COLUMN_CLASSNAME,
  FLEXIBLE_GROUPBOX_CLASSNAME, FLEXIBLE_GROUPBOX_CLASSNAME_LABEL,
  FLEXIBLE_LABELED_CHILD_CLASSNAME,
  FLEXIBLE_LABELED_CLASSNAME,
  FLEXIBLE_LABELED_LABEL_CLASSNAME,
  FLEXIBLE_ROOT_CLASSNAME,
  FLEXIBLE_ROW_CLASSNAME
} from "./css-classes";
import clsx from "clsx";

interface FlexibleColumnRoot {
  key: string,
  children: ReactNode[]
}

function FlexibleColumnRoot({key, children}: FlexibleColumnRoot) {
  return el("div", {
    className: FLEXIBLE_ROOT_CLASSNAME,
    style: {
      width: "100%",
    }
  }, children)
}

interface FlexibleColumn {
  key: string
  sizes?: FlexibleSizes
  align: FlexibleAlign
  children: ReactNode[]
}

function FlexibleColumn({sizes, children}: FlexibleColumn) {
  return el("div", {
    className: FLEXIBLE_COLUMN_CLASSNAME,
    style: sizes && {
      flexBasis: `${sizes.min}em`,
      minWidth: `${sizes.min}em`,
      maxWidth: sizes.max ? `${sizes.max}em` : undefined,
    }
  }, children)
}

type GroupboxDisplayMode = 'accent'

interface FlexibleGroupbox {
  key: string
  label?: string
  displayMode?: GroupboxDisplayMode
  sizes: FlexibleSizes
  align: FlexibleAlign
  children: ReactNode[]
}

function createLabel(label: string | undefined, children: ReactNode[]) {
  return label ? [
      el("span", {className: FLEXIBLE_GROUPBOX_CLASSNAME_LABEL}, label),
      ...React.Children.toArray(children)
    ] :
    children
}

function FlexibleGroupbox({key, label, displayMode, sizes, children}: FlexibleGroupbox) {

  return el("div", {
    className: clsx(FLEXIBLE_GROUPBOX_CLASSNAME, displayMode === 'accent' && FLEXIBLE_ACCENTED_GROUPBOX_CLASSNAME),
    style: {
      flexBasis: `${sizes.min}em`,
      minWidth: `${sizes.min}em`,
      maxWidth: sizes.max ? `${sizes.max}em` : undefined,
    }
  }, createLabel(label, children))
}

interface FlexibleChildAlign {
  props: {
    align?: FlexibleAlign
  }
}

interface FlexibleRow {
  key: string
  sizes?: FlexibleSizes
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
    const newAlign = elem.props.align || 'f'
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
  if (currentAlign === 'c') newChildren[currentInd].push(spacer)
  return newChildren
}

function wrapInRow(key: string, props: HTMLAttributes<HTMLDivElement>, children: ReactNode[]) {
  return el("div", {key, ...props}, children)
}

function FlexibleRow({key, sizes, children}: FlexibleRow) {
  const separated = separateChildren(children)
  const props: HTMLAttributes<HTMLDivElement> = {
    className: FLEXIBLE_ROW_CLASSNAME,
    style: sizes && {
      minWidth: `${sizes.min}em`,
      maxWidth: sizes.max ? `${sizes.max}em` : undefined,
    }
  }
  return separated.map((list, ind) => wrapInRow(`${key}-${ind}`, props, list))
}

interface FlexibleCell {
  key: string
  sizes?: FlexibleSizes
  children: ReactNode[]
}

function FlexibleCell({key, sizes, children}: FlexibleCell) {
  return el("div", {
    className: FLEXIBLE_CELL_CLASSNAME,
    style: sizes && {
      flexBasis: `${sizes.min}em`,
      maxWidth: sizes.max ? `${sizes.max}em` : undefined,
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
        flexDirection: horizontal ? "row" : "column",
        flexBasis: `${sizes.min}em`,
        maxWidth: sizes.max ? `${sizes.max}em` : undefined,
      }
    },
    el("label", {
      className: FLEXIBLE_LABELED_LABEL_CLASSNAME,
    }, el("span", {}, label), labelChildren),
    el("div", {
      className: FLEXIBLE_LABELED_CHILD_CLASSNAME,
    }, children)
  )
}

export const flexibleComponents = {FlexibleColumnRoot, FlexibleColumn, FlexibleGroupbox, FlexibleRow, FlexibleCell, FlexibleLabeled}
