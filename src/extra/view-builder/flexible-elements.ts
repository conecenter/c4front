import React, {createElement as el, CSSProperties, ReactNode} from "react";
import {
  FLEXIBLE_CELL_CLASSNAME,
  FLEXIBLE_COLUMN_CLASSNAME,
  FLEXIBLE_GROUPBOX_CLASSNAME,
  FLEXIBLE_ROOT_CLASSNAME, FLEXIBLE_ROW_CLASSNAME,
  FlexibleSizes
} from "./flexible-api";
import {provideColumn, provideRow, useFDirectionIsColumn} from "./flexible-direction";

interface FlexibleColumnRootProps {
  key: string,
  children: ReactNode[]
}

function debugBorder(color: string): CSSProperties {
  return {
    border: "5px dashed",
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
      maxWidth: `${sizes.max}em`,
      maxHeight: "fit-content",
      ...debugBorder("red"),
    }
  }, provideColumn(children))
}

interface FlexibleGroupboxProps {
  key: string
  sizes: FlexibleSizes
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
      maxWidth: `${sizes.max}em`,
      maxHeight: "fit-content",
      ...debugBorder("orange"),
    }
  }, provideColumn(children))
}

interface FlexibleRowProps {
  key: string
  sizes: FlexibleSizes
  leftChildren: ReactNode[]
  centerChildren: ReactNode[]
  rightChildren: ReactNode[]
}

function addEmptyDiv(children: ReactNode[]) {
  const childrenArray = React.Children.toArray(children)
  return childrenArray.length > 0 ? [el("div", {style: {marginLeft: "auto"}}), ...React.Children.toArray(children)] : []
}

function FlexibleRow({key, sizes, leftChildren, centerChildren, rightChildren}: FlexibleRowProps) {
  return el("div", {
    className: FLEXIBLE_ROW_CLASSNAME,
    style: {
      display: "flex",
      flexGrow: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      minWidth: `${sizes.min}em`,
      maxWidth: `${sizes.max}em`,
      ...debugBorder("blue"),
    }
  }, provideRow([
    ...React.Children.toArray(leftChildren),
    ...addEmptyDiv(centerChildren),
    ...addEmptyDiv(rightChildren)
  ]))
}

interface FlexibleCellProps {
  key: string
  sizes: FlexibleSizes
  children: ReactNode[]
}

function FlexibleCell({key, sizes, children}: FlexibleCellProps) {
  const parentDirection = useFDirectionIsColumn()
  const cellStyles = parentDirection ? {
    minWidth: `${sizes.min}em`,
    maxWidth: `${sizes.max}em`
  } : {
    flexGrow: 1,
    flexBasis: `${sizes.min}em`,
    maxWidth: `${sizes.max}em`,
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
