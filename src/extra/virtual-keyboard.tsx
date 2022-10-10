import React, { CSSProperties, MutableRefObject, useContext, useRef, useState } from 'react';
import { PathContext } from './focus-control';
import { ColorDef } from './view-builder/common-api';
import { createElement as el, ReactNode, useCallback, useMemo} from 'react'
import {ScrollInfoContext, ScrollInfo} from "../extra/scroll-info-context";
import {useAnimationFrame} from "../main/vdom-hooks";
import clsx from 'clsx';

const BOTTOM_ROW_CLASS = "bottom-row";
const VK_COL_WIDTH = 2;
const VK_ROW_HEIGHT = 2.2;


interface PositioningStyles {
    [name: string]: CSSProperties
}

const POSITIONING_STYLES: PositioningStyles = {
    bottom: {
        position: 'fixed',
        bottom: '0',
        right: '0',
        left: '0',
        margin: 'auto'
    },
    left: {
        position: 'fixed',
        left: '0',
        top: '0',
        bottom: '0',
        margin: 'auto'
    },
    right: {
        position: 'fixed',
        right: '0',
        top: '0',
        bottom: '0',
        margin: 'auto'
    },
    static: {
        position: 'relative'
    }
}

interface VirtualKeyboard {
    key: string,
    identity: Object,
    keyboardTypes: KeyboardType[],
    position: "left" | "right" | "bottom" | "static",
    setupType?: string
}

interface KeyboardType {
    name: string,   // TODO: text, number, location ?
    modes: KeyboardMode[]   // TODO: change to [ Key[] ] ? why another object?
}

interface KeyboardMode {
    keys: Key[]
}

interface Key {
    key: string,
    symbol?: string,
    row: number,
    column: number, 
    width: number, 
    height: number,
    color?: ColorDef
}

function VirtualKeyboard({ keyboardTypes, setupType, position }: VirtualKeyboard) {
    const vkRef = useRef<HTMLDivElement | null>(null);
    
    // Show VK logic
    const [showVk, setShowVk] = useState(false);
    const currentPath = useContext(PathContext);
    const inputInFocus = getInputInFocus(vkRef, currentPath);
    if (setupType || inputInFocus) !showVk && setShowVk(true);
    else showVk && setShowVk(false);
    if (!showVk) return null;

    // Get keyboard type
    const keyboardTypeName = setupType || inputInFocus?.dataset?.type || 'text';
    const keyboardType = keyboardTypes.find(type => type.name === keyboardTypeName);
    if (!keyboardType) return null;

    // Positioning logic
    const [ rowsTotal, colsTotal ] = keyboardType.modes[0].keys.reduce((dimensions, key) => {
        const { row, column, width, height } = key;
        const colMax = column + width - 1;
        const rowsTotal =  colMax > dimensions[0] ? colMax : dimensions[0]; // TODO: function!
        const rowMax = row + height - 1;
        const colsTotal = rowMax > dimensions[1] ? rowMax : dimensions[1];
        return [rowsTotal, colsTotal];
    }, [0, 0]);    

    const wrapperStyle: CSSProperties = {
        height: `${VK_ROW_HEIGHT * rowsTotal}em`,
        width: `${VK_COL_WIDTH * colsTotal}em`,
        ...POSITIONING_STYLES[position]
    }
    return (
            <div ref={vkRef}  
                 style={wrapperStyle} 
                 className={clsx('virtualKeyboard', position === 'bottom' && BOTTOM_ROW_CLASS)} >

                {keyboardType.modes[0].keys.map((btn, ind) => {
                    const { key, symbol, row, column, width, height } = btn;
                    const btnStyle: CSSProperties = {
                        position: 'absolute',
                        left: `${(column - 1) * 100 / colsTotal}%`,
                        top: `${VK_ROW_HEIGHT * (row - 1)}em`,
                        width: `${width * 100 / colsTotal}%`,
                        height: `${VK_ROW_HEIGHT * height}em`,
                    }
                    return <VKKey key={`${key}-${ind}`} style={btnStyle} {...{ keyCode: key, symbol }} />
                })}
            </div>
        );
}

 function getInputInFocus(domRef: MutableRefObject<HTMLDivElement | null>, currentPath: string) {
    const cNode = domRef.current?.ownerDocument.querySelector(`[data-path]=${currentPath}`);
    const input = cNode?.querySelector<HTMLInputElement>('input:not([readonly])');
    return input;
}


 interface VKKey {
    key: string,
    keyCode: string,
    symbol?: string,
    style: CSSProperties    
 }

 function VKKey({keyCode, symbol, style}: VKKey) {
    return (
        <button type='button' style={style} >
            {symbol ?? keyCode}
        </button>
    )
 }

 export { VirtualKeyboard };




interface ScrollInfoState extends ScrollInfo {
  currentScrollOffset: number,
  scrollingUp: boolean,
  scrollUpStart: number,
  scrollDownStart: number,
  totalTopHeight: number,
  totalBottomHeight: number,
  totalFilterHeight: number,
  classes: string
}

const defaultValue: ScrollInfoState = {
  currentScrollOffset: 0,
  scrollingUp: false,
  scrollUpStart: 0,
  scrollDownStart: 0,
  elementsStyles: new Map(),
  totalTopHeight: 0,
  totalBottomHeight: 0,
  totalFilterHeight: 0,
  classes: ""
}

interface ScrollInfoProviderProps {
  children: ReactNode[]
}

const HIDE_ON_SCROLL = "hideOnScroll"
const TOP_ROW_CLASS = "topRow"
const DATA_PATH = "data-path"
const TOP_ROW_SELECTOR = ".topRow"
const BOTTOM_ROW_SELECTOR = ".bottom-row"
const GRID_WRAP_SELECTOR = ".gridWrap"
const FILTER_AREA_SELECTOR = ".filterArea"

const MIN_SCROLL_DELTA = 5

interface ScrollDiff {
  scrollingUp: boolean,
  scrollUpStart: number,
  scrollDownStart: number,
}

function calculateScrollDiff(
  {
    currentScrollOffset: previousScroll,
    scrollUpStart,
    scrollDownStart,
    scrollingUp,
  }: ScrollInfoState,
  currentScrollOffset: number,
  totalTopHeight: number,
  totalBottomHeight: number,
): ScrollDiff {
  if (currentScrollOffset == 0) // Initial position
    return {scrollingUp: false, scrollUpStart: 0, scrollDownStart: 0}
  else if (scrollingUp && currentScrollOffset > previousScroll + MIN_SCROLL_DELTA) // Scrolling down after scrolling up
    return {scrollingUp: false, scrollUpStart: scrollUpStart, scrollDownStart: currentScrollOffset + totalBottomHeight}
  else if (!scrollingUp && currentScrollOffset < previousScroll - MIN_SCROLL_DELTA) // Scrolling up after scrolling down
    return {scrollingUp: true, scrollUpStart: Math.max(currentScrollOffset - totalTopHeight, 0), scrollDownStart: currentScrollOffset}
  else
    return {scrollingUp: scrollingUp, scrollUpStart: scrollUpStart, scrollDownStart: scrollDownStart}
}

interface TopScrollPositions {
  spaceUsed: number,
  alwaysShownHeight: number,
  floatingPos: number,
  topElementsStyles: Map<string, string>
}

function calculateTopPositions(
  {scrollUpStart}: ScrollDiff,
  currentScrollOffset: number,
  topElements: HTMLElement[] | null,
): TopScrollPositions {
  const initialState: TopScrollPositions = {
    spaceUsed: 0,
    alwaysShownHeight: 0,
    floatingPos: Math.min(scrollUpStart - currentScrollOffset, 0),
    topElementsStyles: new Map()
  }

  function iteration(
    {spaceUsed, alwaysShownHeight, floatingPos, topElementsStyles}: TopScrollPositions,
    elem: HTMLElement
  ): TopScrollPositions {
    const alwaysShown = !elem.classList.contains(HIDE_ON_SCROLL)
    const elemTop = alwaysShown ? Math.max(alwaysShownHeight, floatingPos) : floatingPos
    const elemHeight = elem.offsetHeight
    return {
      spaceUsed: Math.max(elemTop + elemHeight, spaceUsed),
      alwaysShownHeight: alwaysShown ? alwaysShownHeight + elemHeight : alwaysShownHeight,
      floatingPos: floatingPos + elemHeight,
      topElementsStyles: topElementsStyles.set(elem.getAttribute(DATA_PATH) + "", elemTop + 'px')
    }
  }

  const result = topElements ? topElements.reduce(iteration, initialState) : initialState
  return {...result, spaceUsed: Math.max(result.spaceUsed, 0)}
}

function calculateBottomPositions(
  {scrollDownStart}: ScrollDiff,
  currentScrollOffset: number,
  bottomElements: HTMLElement[] | null,
): Map<string, string> {
  const initialState: TopScrollPositions = {
    spaceUsed: 0,
    alwaysShownHeight: 0,
    floatingPos: Math.min(currentScrollOffset - scrollDownStart, 0),
    topElementsStyles: new Map()
  }

  function iteration(
    {spaceUsed, alwaysShownHeight, floatingPos, topElementsStyles}: TopScrollPositions,
    elem: HTMLElement
  ): TopScrollPositions {
    const alwaysShown = !elem.classList.contains(HIDE_ON_SCROLL)
    const elemTop = alwaysShown ? Math.max(alwaysShownHeight, floatingPos) : floatingPos
    const elemHeight = elem.offsetHeight
    return {
      spaceUsed: Math.max(elemTop + elemHeight, spaceUsed),
      alwaysShownHeight: alwaysShown ? alwaysShownHeight + elemHeight : alwaysShownHeight,
      floatingPos: floatingPos + elemHeight,
      topElementsStyles: topElementsStyles.set(elem.getAttribute(DATA_PATH) + "", elemTop + 'px')
    }
  }

  const result = bottomElements ? bottomElements.reverse().reduce(iteration, initialState) : initialState
  return result.topElementsStyles
}

interface FilterAreaPosition {
  filterSpaceUsed: number,
  floatingPos: number
}

function calculateFilterArea(
  filterAreas: HTMLElement[],
  spaceUsed: number,
  floatingPos: number
): FilterAreaPosition {
  const initialState: FilterAreaPosition = {
    filterSpaceUsed: spaceUsed,
    floatingPos: floatingPos,
  }

  function iteration(
    {filterSpaceUsed, floatingPos}: FilterAreaPosition,
    elem: HTMLElement
  ): FilterAreaPosition {
    const elemTop = floatingPos
    const elemHeight = elem.offsetHeight
    return {
      filterSpaceUsed: Math.max(elemTop + elemHeight, filterSpaceUsed),
      floatingPos: floatingPos + elemHeight,
    }
  }

  return filterAreas.reduce(iteration, initialState)
}

function calculateGridClasses(
  ownerDocument: Document | null,
  topSpaceUsed: number,
  floatingPos: number
): string {
  const gridWrappers = ownerDocument ? [...ownerDocument.querySelectorAll<HTMLElement>(GRID_WRAP_SELECTOR)] : []

  const classes = gridWrappers.map(gridWrapper => {
    const {filterSpaceUsed} = calculateFilterArea([...gridWrapper.querySelectorAll<HTMLElement>(".filterArea")], topSpaceUsed, floatingPos)
    const grid = gridWrapper.querySelectorAll(".grid")[0]
    const gridKey = grid.getAttribute("data-grid-key") + ""
    const headerRows = (grid.getAttribute("header-row-keys") + "").split(" ")
    let rowHeightMap = new Map<string, number>()
    const headers = [...grid.querySelectorAll(".tableHeadContainer")]
    headers.forEach(header => {
      const rowKey = header.getAttribute("data-row-key") + ""
      if (!rowHeightMap.has(rowKey)) {
        rowHeightMap.set(rowKey, header.getBoundingClientRect().height)
      }
    })
    let headerRowToOffset = new Map<string, number>()

    function reduceHeight(current: number, rowKey: string): number {
      headerRowToOffset.set(rowKey, current)
      // @ts-ignore
      return current + (rowHeightMap.get(rowKey) ? rowHeightMap.get(rowKey) : 0)
    }

    headerRows.reduce(reduceHeight, filterSpaceUsed)
    return [...headerRowToOffset.entries()].map(elem => `.grid[data-grid-key="${gridKey}"] > .tableHeadContainer[data-row-key="${elem[0]}"]{z-index: 450;position:sticky;top:${elem[1]}px}`)
  })
  return classes.map(classList => classList.join("\n")).join("\n")

}

interface GetElements {
  elements: HTMLElement[] | null,
  elementsLength: number,
  elementsHeight: number
}

function getElements(ownerDocument: Document | null, selector: string): GetElements {
  const elements: HTMLElement[] | null = ownerDocument ? [...ownerDocument.querySelectorAll<HTMLElement>(selector)] : []
  const elementsLength = elements ? elements.length : 0
  const elementsHeight = elements.reduce(((prev, currentElement) => prev + currentElement.offsetHeight), 0)
  return {elements: elements, elementsLength: elementsLength, elementsHeight: elementsHeight}
}

function ScrollInfoProvider({children}: ScrollInfoProviderProps) {
  const [scrollInfo, setScrollInfo] = useState(defaultValue)
  const [docRoot, setDocRoot] = useState<Element | null>(null)
  const ownerDocument = docRoot ? docRoot.ownerDocument : null
  const ownerWindow = ownerDocument && ownerDocument.defaultView ? ownerDocument.defaultView : null

  const listener = useCallback(e => {
    setScrollInfo((prev: ScrollInfoState) => {
      const currentScrollOffset = ownerWindow ? ownerWindow.pageYOffset : 0

      const {elements: topElements, elementsLength: topElementsLength, elementsHeight: totalTopHeight} = getElements(ownerDocument, TOP_ROW_SELECTOR)
      const {elements: bottomElements, elementsLength: bottomElementsLength, elementsHeight: totalBottomHeight} = getElements(ownerDocument, BOTTOM_ROW_SELECTOR)
      const {elementsHeight: totalFilterHeight} = getElements(ownerDocument, FILTER_AREA_SELECTOR)

      if (prev.currentScrollOffset === currentScrollOffset &&
        topElementsLength + bottomElementsLength == prev.elementsStyles.size &&
        totalTopHeight == prev.totalTopHeight && 
        totalBottomHeight == prev.totalBottomHeight &&
        totalFilterHeight == prev.totalFilterHeight
      ) return prev;
      else {
        const scrollDiff = calculateScrollDiff(prev, currentScrollOffset, totalTopHeight, totalBottomHeight)
        // top-rows
        const {
          spaceUsed: topSpaceUsed,
          topElementsStyles,
          floatingPos
        } = calculateTopPositions(scrollDiff, currentScrollOffset, topElements)
        // bottom-rows
        const bottomElementStyles = calculateBottomPositions(scrollDiff, currentScrollOffset, bottomElements)
        // grid
        const gridClasses = calculateGridClasses(ownerDocument, topSpaceUsed, floatingPos)
        const filterClasses = gridClasses !== "" ? `\n.filterArea{z-index: 500;position:sticky !important;top:${floatingPos}px}` : ""
        return {
          currentScrollOffset: currentScrollOffset,
          scrollingUp: scrollDiff.scrollingUp,
          scrollUpStart: scrollDiff.scrollUpStart,
          scrollDownStart: scrollDiff.scrollDownStart,
          elementsStyles: new Map([...topElementsStyles, ...bottomElementStyles]),
          totalTopHeight: totalTopHeight,
          totalBottomHeight: totalBottomHeight,
          totalFilterHeight: totalFilterHeight,
          classes: gridClasses + filterClasses
        }
      }
    })
  }, [docRoot]);
  const {classes, totalTopHeight, totalBottomHeight} = useMemo(
    () => (
      {
        classes: scrollInfo.classes,
        totalTopHeight: scrollInfo.totalTopHeight,
        totalBottomHeight: scrollInfo.totalBottomHeight,
      }),
    [
      scrollInfo.classes,
      scrollInfo.totalTopHeight,
      scrollInfo.totalBottomHeight
    ]
  )
  const scrollInfoCached = useMemo<ScrollInfo>(
    () => (
      {
        elementsStyles: scrollInfo.elementsStyles,
      }),
    [
      scrollInfo.elementsStyles
    ]
  )

  useAnimationFrame(docRoot, listener)

  return el(
    "div",
    {
      key: "scroll-info-provider",
      style: {paddingTop: totalTopHeight + "px", paddingBottom: totalBottomHeight + "px"},
      ref: setDocRoot
    },
    el("style", {dangerouslySetInnerHTML: {__html: classes}}),
    el(ScrollInfoContext.Provider, {value: scrollInfoCached}, children)
  )
}

export {ScrollInfoProvider, HIDE_ON_SCROLL, BOTTOM_ROW_CLASS, TOP_ROW_CLASS, DATA_PATH};
export type {ScrollInfo};
