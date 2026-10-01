import React, {createElement as el, HTMLAttributes, ReactElement, ReactNode} from "react";
import clsx from "clsx";
import { NoCaptionContext } from '../../main/vdom-hooks';
import { FLEXIBLE_CELL_CLASSNAME, FLEXIBLE_COLUMN_CLASSNAME, FLEXIBLE_ROW_CLASSNAME, UNBOUNDED_CLASSNAME } from "./css-classes";
import { FlexibleCellProps, FlexibleColumnProps, FlexibleRowProps, FlexSize, ScrollableColumnProps, ThinFlexibleRowProps } from "types/c4gen.UiElementsApi";
import { Align } from "types/c4gen.CommonElementsApi";

const getCssFromSizes = (sizes?: FlexSize) => sizes && {
  ...(typeof sizes.min === 'number') && { minWidth: `${sizes.min}em` },
  ...(typeof sizes.max === 'number') && { maxWidth: `${sizes.max}em` },
  ...(typeof sizes.basis === 'number') && { flexBasis: `${sizes.basis}em` }
}

function FlexibleColumn({sizes, className, align, children}: FlexibleColumnProps) {
  const anchored = align && !sizes?.max;
  return el("div", {
    className: clsx(FLEXIBLE_COLUMN_CLASSNAME, className),
    style: {
      ...anchored && { flexGrow: 0 },
      ...getCssFromSizes(sizes)
    }
  }, children)
}

function ScrollableColumn({height, ...props}: ScrollableColumnProps) {
  return el('div', { style: {maxHeight: `${height}em`, overflowY: 'auto'} }, FlexibleColumn(props));
}

function correctNext(prev: Align, next: Align): boolean {
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

type WithOptionalAlign = { align?: Align };

function separateChildren(children?: ReactElement[]): ReactNode[][] {
  const childrenArray = React.Children.toArray(children) as ReactElement<WithOptionalAlign>[]
  const newChildren = [[]] as ReactNode[][]
  let currentAlign: Align = "l"
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
  return el("div", {key, ...props}, ...children)
}

function FlexibleRow({sizes, className, align, children}: Omit<FlexibleRowProps, 'identity'>) {
  const anchored = align && !sizes?.max;
  const props: HTMLAttributes<HTMLDivElement> = {
    className: clsx(FLEXIBLE_ROW_CLASSNAME, className, !sizes?.max && UNBOUNDED_CLASSNAME),
    style: {
      ...anchored && { flexGrow: 0 },
      ...getCssFromSizes(sizes)
    }
  }
  const separated = separateChildren(children).map((list, ind) => wrapInRow(`row-${ind}`, props, list)) 
  return el(React.Fragment, null, separated)
}

function ThinFlexibleRow(props: Omit<ThinFlexibleRowProps, 'identity'>) {
  return el(
      NoCaptionContext.Provider,
      {value: true},
      el(FlexibleRow, props)
  );
}

function FlexibleCell({align, sizes, className, children}: FlexibleCellProps) {
  const hasMaxSize = !!sizes && typeof sizes.max === 'number';
  const anchored = align && !hasMaxSize;
  return el("div", {
    className: clsx(FLEXIBLE_CELL_CLASSNAME, className, !sizes?.max && UNBOUNDED_CLASSNAME),
    style: {
      ...anchored && { flexGrow: 0 },
      ...getCssFromSizes(sizes)
    }
  }, children)
}

export const flexibleComponents = {FlexibleColumn, ScrollableColumn, FlexibleRow, ThinFlexibleRow, FlexibleCell}
