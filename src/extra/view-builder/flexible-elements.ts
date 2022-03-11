import {CSSProperties, ReactNode} from "react";
import {FlexibleSizes} from "./flexible-api";
import {createElement as el} from "react";
import {DatePickerInputElement} from "../datepicker/datepicker";

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
  }, children)
}

interface FlexibleGroupboxProps {
  key: string
  sizes: FlexibleSizes
  children: ReactNode[]
}

function FlexibleGroupbox({key, sizes, children}: FlexibleGroupboxProps) {
  return el("div", {
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
  }, children)
}

interface FlexibleRowProps {
  key: string
  sizes: FlexibleSizes
  children: ReactNode[]
}

function FlexibleRow({key, sizes, children}: FlexibleRowProps) {
  return el("div", {
    style: {
      display: "flex",
      flexGrow: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      minWidth: `${sizes.min}em`,
      maxWidth: `${sizes.max}em`,
      ...debugBorder("blue"),
    }
  }, children)
}

interface FlexibleCellProps {
  key: string
  sizes: FlexibleSizes
  children: ReactNode[]
}

function FlexibleCell({key, sizes, children}: FlexibleCellProps) {
  return el("div", {
    style: {
      display: "inline-block",
      flexGrow: 1,
      flexBasis: `${sizes.min}em`,
      maxWidth: `${sizes.max}em`,
      ...debugBorder("green"),
    }
  }, children)
}

export const flexibleComponents = {FlexibleColumnRoot, FlexibleColumn, FlexibleGroupbox, FlexibleRow, FlexibleCell}
