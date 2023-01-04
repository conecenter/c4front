import {CSSProperties} from "react";

export interface FlexibleSizes {
  min: number,
  max?: number
}



type FlexibleAlign = 'l' | 'c' | 'r' | 'f'
const isFill = (align: FlexibleAlign): align is 'f' => align === 'f'
const alignSelfStyle = (align: FlexibleAlign): CSSProperties =>
  align === 'c' ? {alignSelf: "center"} :
    align === 'r' ? {alignSelf: "flex-end"} :
      {}

export {
  isFill,
  alignSelfStyle,
}


export interface FlexibleChildAlign {
  props: {
    align?: FlexibleAlign
  }
}

export type {FlexibleAlign}
