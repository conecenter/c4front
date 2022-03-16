import {createElement as el, CSSProperties, ReactNode} from "react";
import {
  FLEXIBLE_CELL_CLASSNAME,
  FLEXIBLE_COLUMN_CLASSNAME,
  FLEXIBLE_GROUPBOX_CLASSNAME,
  FLEXIBLE_ROOT_CLASSNAME,
  FLEXIBLE_ROW_CLASSNAME,
  FlexibleAlign,
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

interface FlexibleRowProps {
  key: string
  sizes: FlexibleSizes
  align: FlexibleAlign
  children: ReactNode[]
}

function FlexibleRow({key, sizes, children}: FlexibleRowProps) {
  return el("div", {
    className: FLEXIBLE_ROW_CLASSNAME,
    style: {
      display: "flex",
      flexGrow: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      minWidth: `${sizes.min}em`,
      maxWidth: sizes.max ? `${sizes.max}em` : undefined,
      ...debugBorder("blue"),
    }
  }, provideRow(children))
}

interface FlexibleCellProps {
  key: string
  sizes: FlexibleSizes
  align: FlexibleAlign
  children: ReactNode[]
}

function FlexibleCell({key, sizes, children}: FlexibleCellProps) {
  const parentDirection = useFDirectionIsColumn()
  const cellStyles = parentDirection ? {
    minWidth: `${sizes.min}em`,
    maxWidth: sizes.max ? `${sizes.max}em` : undefined,
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
