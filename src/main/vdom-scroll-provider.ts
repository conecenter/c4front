import {createContext, createElement as el, ReactNode, useCallback, useMemo, useState} from 'react'
import {useAnimationFrame} from "./vdom-hooks";

interface ScrollInfo {
    currentScrollOffset: number,
    scrollingUp: boolean,
    scrollUpStart: number, // ???
    elementsStyles: Map<string, string>,
    totalTopHeight: number,
    classes: string
}

const defaultValue: ScrollInfo = {
    currentScrollOffset: 0,
    scrollingUp: false,
    scrollUpStart: 0,
    elementsStyles: new Map(),
    totalTopHeight: 0,
    classes: ""
}

const ScrollInfoContext = createContext(defaultValue)

interface ScrollInfoProviderProps {
    children: ReactNode[]
}

const TOP_ROW = ".top-row"
const HIDE_ON_SCROLL = "hide-on-scroll"
const GRID_WRAP_SELECTOR = ".gridWrap"

const MIN_SCROLL_DELTA = 5

interface ScrollDiff {
    scrollingUp: boolean,
    scrollUpStart: number
}

function calculateScrollDiff({
                                 currentScrollOffset: previousScroll,
                                 scrollUpStart,
                                 scrollingUp
                             }: ScrollInfo,
                             currentScrollOffset: number,
                             totalTopHeight: number): ScrollDiff {
    if (currentScrollOffset == 0) // Initial position
        return {scrollingUp: false, scrollUpStart: 0}
    else if (scrollingUp && currentScrollOffset > previousScroll + MIN_SCROLL_DELTA) // Scrolling down after scrolling up
        return {scrollingUp: false, scrollUpStart: scrollUpStart}
    else if (!scrollingUp && currentScrollOffset < previousScroll - MIN_SCROLL_DELTA) // Scrolling up after scrolling down
        return {scrollingUp: true, scrollUpStart: Math.max(previousScroll - totalTopHeight, 0)}
    else
        return {scrollingUp: scrollingUp, scrollUpStart: scrollUpStart}
}

interface TopScrollPositions {
    spaceUsed: number,
    alwaysShownHeight: number,
    floatingPos: number,
    elementStyles: Map<string, string>
}

function calculateTopPositions(
    {scrollUpStart}: ScrollDiff,
    currentScrollOffset: number,
    topElements: HTMLElement[] | null
): TopScrollPositions {
    const initialState: TopScrollPositions = {
        spaceUsed: 0,
        alwaysShownHeight: 0,
        floatingPos: Math.min(scrollUpStart - currentScrollOffset, 0),
        elementStyles: new Map()
    }

    function iteration(
        {spaceUsed, alwaysShownHeight, floatingPos, elementStyles}: TopScrollPositions,
        elem: HTMLElement
    ): TopScrollPositions {
        const alwaysShown = !elem.classList.contains(HIDE_ON_SCROLL)
        const elemTop = alwaysShown ? Math.max(alwaysShownHeight, floatingPos) : floatingPos
        const elemHeight = elem.offsetHeight
        return {
            spaceUsed: Math.max(elemTop + elemHeight, spaceUsed),
            alwaysShownHeight: alwaysShown ? alwaysShownHeight + elemHeight : alwaysShownHeight,
            floatingPos: floatingPos + elemHeight,
            elementStyles: elementStyles.set(elem.getAttribute("data-path") + "", elemTop + 'px')
        }
    }

    const result = topElements ? topElements.reduce(iteration, initialState) : initialState
    return {...result, spaceUsed: Math.max(result.spaceUsed, 0)}
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

function ScrollInfoProvider({children}: ScrollInfoProviderProps) {
    const [scrollInfo, setScrollInfo] = useState(defaultValue)
    const [docRoot, setDocRoot] = useState<Element | null>(null)
    const ownerDocument = docRoot ? docRoot.ownerDocument : null
    const ownerWindow = ownerDocument && ownerDocument.defaultView ? ownerDocument.defaultView : null

    const listener = useCallback(e => {
        setScrollInfo((prev: ScrollInfo) => {
            const currentScrollOffset = ownerWindow ? ownerWindow.pageYOffset : 0
            const topElements: HTMLElement[] | null = ownerDocument ? [...ownerDocument.querySelectorAll<HTMLElement>(TOP_ROW)] : []
            const topElementsLength = topElements ? topElements.length : 0
            const totalTopHeight = topElements.reduce(((prev, currentElement) => prev + currentElement.offsetHeight), 0)
            if (prev.currentScrollOffset === currentScrollOffset &&
                topElementsLength == prev.elementsStyles.size &&
                totalTopHeight == prev.totalTopHeight) return prev
            else {
                const scrollDiff = calculateScrollDiff(prev, currentScrollOffset, totalTopHeight)
                // top-rows
                const {
                    spaceUsed: topSpaceUsed,
                    elementStyles,
                    floatingPos
                } = calculateTopPositions(scrollDiff, currentScrollOffset, topElements)
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
                    const headerCss = [...headerRowToOffset.entries()].map(elem => `.grid[data-grid-key="${gridKey}"] > .tableHeadContainer[data-row-key="${elem[0]}"]{z-index: 10000;position:sticky;top:${elem[1]}px}`)
                    return headerCss
                })
                return {
                    currentScrollOffset: currentScrollOffset,
                    scrollingUp: scrollDiff.scrollingUp,
                    scrollUpStart: scrollDiff.scrollUpStart,
                    elementsStyles: elementStyles,
                    totalTopHeight: totalTopHeight,
                    classes: classes.map(cls => cls.join("\n")).join("\n") + `\n.filterArea{z-index: 10000;position:sticky !important;top:${floatingPos}px}`
                }
            }
        })
    }, [docRoot]);

    const scrollInfoCached = useMemo<ScrollInfo>(() => (
            {
                currentScrollOffset: scrollInfo.currentScrollOffset,
                scrollingUp: scrollInfo.scrollingUp,
                scrollUpStart: scrollInfo.scrollUpStart,
                elementsStyles: scrollInfo.elementsStyles,
                totalTopHeight: scrollInfo.totalTopHeight,
                classes: ""
            }),
        [
            scrollInfo.currentScrollOffset,
            scrollInfo.scrollingUp,
            scrollInfo.scrollUpStart,
            scrollInfo.elementsStyles,
            scrollInfo.totalTopHeight
        ])

    useAnimationFrame(docRoot, listener)

    return el("div",
        {
            key: "scroll-info-provider",
            style: {marginTop: scrollInfoCached.totalTopHeight + "px"},
            ref: setDocRoot
        },
        el("style", {dangerouslySetInnerHTML: {__html: scrollInfo.classes}}),
        el(ScrollInfoContext.Provider, {value: scrollInfoCached}, children)
    )
}

export {ScrollInfoContext, ScrollInfoProvider};
export type {ScrollInfo};
