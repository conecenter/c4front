import {CSSProperties} from "react";

export interface FlexibleSizes {
  min: number,
  max?: number
}

const FLEXIBLE_ROOT_CLASSNAME = "flexibleRoot"
const FLEXIBLE_COLUMN_CLASSNAME = "flexibleColumn"
const FLEXIBLE_GROUPBOX_CLASSNAME = "flexibleGroupBox"
const FLEXIBLE_ROW_CLASSNAME = "flexibleRow"
const FLEXIBLE_CELL_CLASSNAME = "flexibleCell"

type FlexibleAlign = 'l' | 'c' | 'r' | 'f'
const isFill = (align: FlexibleAlign): align is 'f' => align === 'f'
const alignSelfStyle = (align: FlexibleAlign): CSSProperties =>
  align === 'c' ? {alignSelf: "center"} :
    align === 'r' ? {alignSelf: "flex-end"} :
      {}

export {
  FLEXIBLE_ROOT_CLASSNAME,
  FLEXIBLE_COLUMN_CLASSNAME,
  FLEXIBLE_GROUPBOX_CLASSNAME,
  FLEXIBLE_ROW_CLASSNAME,
  FLEXIBLE_CELL_CLASSNAME,
  isFill,
  alignSelfStyle,
}

export type {FlexibleAlign}
