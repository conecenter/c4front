

import { createElement as $, useMemo, useState, cloneElement, useCallback, useEffect } from "react"

import { identityAt, deleted, never, sortedWith, findFirstParent } from "./vdom-util.js"
import { useWidth, useEventListener, useSync, NoCaptionContext } from "./vdom-hooks.js"
import { useGridDrag } from "./grid-drag.js"

const dragRowIdOf = identityAt('dragRow')
const dragColIdOf = identityAt('dragCol')

const ROW_KEYS = {
    HEAD: "head",
    DRAG: "drag",
}

const GRID_CLASS_NAMES = {
    CELL: "tableCellContainer headerColor-border",
}

//// col hiding

const partitionVisibleCols = (cols, outerWidth) => {
    const fit = (count, accWidth) => {
        const col = cols[count]
        if (!col) return count
        const willWidth = accWidth + col.width.min
        if (outerWidth < willWidth) return count
        return fit(count + 1, willWidth)
    }
    const count = fit(0, 0)
    return [cols.slice(0, count), cols.slice(count)]
}

const sortedByHideWill = sortedWith((a, b) => a.hideWill - b.hideWill)

const calcHiddenCols = (cols, outerWidth) => {
    const [visibleCols, hiddenCols] = partitionVisibleCols(sortedByHideWill(cols), outerWidth)
    const hasHiddenCols = hiddenCols.length > 0
    const hiddenColSet = hasHiddenCols && new Set(colKeysOf(hiddenCols))
    const hideElementsForHiddenCols = (mode,toColKey) => (
        hasHiddenCols ? (children => children.filter(c => mode === hiddenColSet.has(toColKey(c)))) :
            mode ? (children => []) : (children => children)
    )
    return { hasHiddenCols, hideElementsForHiddenCols }
}

//// expanding
const useExpanded = () => {
    const [expanded, setExpanded] = useState({})
    const setExpandedItem = useCallback((key, f) => setExpanded(was => {
        const wasValue = !!was[key]
        const willValue = !!f(wasValue)
        return wasValue === willValue ? was : willValue ? { ...was, [key]: 1 } : deleted({ [key]: 1 })(was)
    }), [setExpanded])
    return [expanded, setExpandedItem]
}
const useExpandedElements = (expanded, setExpandedItem) => {
    const toExpanderElements = useCallback((on,cols,children) => on ? children.map(c => {
        const { expanding, rowKey } = c.props
        return expanding==="expander" && rowKey ? cloneElement(c, {
            onClick: ev => setExpandedItem(rowKey, v => !v),
            expander: expanded[rowKey] ? 'expanded' : 'collapsed',
        }) : c
    }) : colKeysOf(cols.filter(col=>col.isExpander))
        .reduce((resCells,expanderColKey)=>resCells.filter(cell=>cell.props.colKey!==expanderColKey), children)
    , [expanded, setExpandedItem])
    const getExpandedCells = useCallback(({ cols, rows, children }) => {
        if (cols.length <= 0) return []
        const posStr = (rowKey, colKey) => rowKey + colKey
        const expandedByPos = Object.fromEntries(
            children.filter(c => expanded[c.props.rowKey] && !c.props.expanding)
                .map(c => [posStr(c.props.rowKey, c.props.colKey), c])
        )
        return rows.filter(row => expanded[row.rowKey]).map(({rowKey}) => {
            const pairs = cols.map(col => {
                const cell = expandedByPos[posStr(rowKey, col.colKey)]
                return cell && [col, cell]
            }).filter(Boolean)
            return [rowKey, pairs]
        })
    }, [expanded])
    return { toExpanderElements, setExpandedItem, getExpandedCells }
}

const expandRowKeys = expanded => rows => rows.flatMap(({rowKey}) => (
    expanded[rowKey] ? [{ rowKey }, { rowKey, rowKeyMod: "-expanded" }] : [{ rowKey }]
))

const hideExpander = hasHiddenCols => hasHiddenCols ? (l => l) : (l => l.filter(c => !c.isExpander))

//// main

const getGridRow = ({ rowKey, rowKeyMod }) => CSS.escape(rowKey + (rowKeyMod || ''))
const getGridCol = ({ colKey }) => CSS.escape(colKey)

const spanAll = "1 / -1"

export function GridCell({ identity, children, rowKey, rowKeyMod, colKey, expanding, expander, dragHandle, noDefCellClass, classNames: argClassNames, gridRow: argGridRow, gridColumn: argGridColumn, ...props }) {
    const gridRow = argGridRow || getGridRow({ rowKey, rowKeyMod })
    const gridColumn = argGridColumn || getGridCol({ colKey })
    const style = { ...props.style, gridRow, gridColumn }
    const expanderProps = expanding==="expander" ? { 'data-expander': expander || 'passive' } : {}
    const argClassNamesStr = argClassNames ? argClassNames.join(" ") : ""
    const className = noDefCellClass ? argClassNamesStr : `${argClassNamesStr} ${GRID_CLASS_NAMES.CELL}`
    return $("div", { ...props, ...expanderProps, 'data-col-key': colKey, 'data-row-key': rowKey, "data-drag-handle": dragHandle, style, className }, children)
}

const colKeysOf = children => children.map(c => c.colKey)

const getGidTemplateRows = rows => rows.map(o => `[${getGridRow(o)}] auto`).join(" ")
const getGridTemplateColumns = columns => columns.map(col => {
    const key = getGridCol(col)
    const maxStr =
        col.width.tp === "bound" ? `${col.width.max}em` :
        col.width.tp === "unbound" ? "auto" : never()
    const width = `minmax(${col.width.min}em,${maxStr})`
    return `[${key}] ${width}`
}).join(" ")

const noChildren = []

//todo: for multi grids with overlapping keys per page implement: rootSelector
// see: x-r-sort-obj-key x-r-sort-order-*

const dragStyles = {
    rootSelector: ".grid",
    bgSelector: ".gridBG",
    dropRoot: "background-color: var(--grid-drop-color)",
    dropItem: "background-color: var(--grid-drop-color)",
    dragItem: "opacity: 50%",
}
const useSyncGridDrag = ({ identity, rows, cols }) => {
    const [dragData, setDragData] = useState({})
    const [dragRowPatches, enqueueDragRowPatch] = useSync(dragRowIdOf(identity))
    const [dragColPatches, enqueueDragColPatch] = useSync(dragColIdOf(identity))
    const checkDrop = useCallback(st=>{
        const {isDown,axis,drag,drop,dropZone} = st
        const [items,getKey,enqueuePatch] =
            axis === "x" ? [cols, s=>s.colKey, enqueueDragColPatch] :
            axis === "y" ? [rows, s=>s.rowKey, enqueueDragRowPatch] : never()
        const canDrop = items.find(s => getKey(s)===drop.key && (dropZone===0 ? s.canDropInto : s.canDropBeside))
        if(!isDown){
            const reset = ()=>setDragData({})
            if(canDrop) {
                const headers = {
                    "x-r-drag-key": drag.key,
                    "x-r-drop-key": drop.key,
                    "x-r-drop-zone": dropZone,
                }
                console.log(headers)
                enqueuePatch({ onAck: reset, headers, retry: true })
            } else reset()
        }
        return canDrop
    },[cols,rows,enqueueDragColPatch,enqueueDragRowPatch,setDragData])
    const [dragCSSContent,onMouseDown] = useGridDrag(dragData,setDragData,dragStyles,checkDrop)
    return [dragData,dragCSSContent,onMouseDown]
}

export function GridRoot({ identity, rows, cols, children: rawChildren }) {
    const children = rawChildren || noChildren//Children.toArray(rawChildren)

    const [dragData,dragCSSContent,onMouseDown] = useSyncGridDrag({ identity, rows, cols })

    const [expanded, setExpandedItem] = useExpanded()

    const hasDragRow = useMemo(()=>children.some(c=>c.props.dragHandle==="x"),[children])
    const gridTemplateRows = useMemo(() => getGidTemplateRows([
        ...(hasDragRow ? [{ rowKey: ROW_KEYS.DRAG }]:[]),
        { rowKey: ROW_KEYS.HEAD },
        ...expandRowKeys(expanded)(rows)
    ]), [hasDragRow, expanded, rows])

    const [gridElement, setGridElement] = useState(null)
    const outerWidth = useWidth(gridElement)
    const { hasHiddenCols, hideElementsForHiddenCols } =
        useMemo(() => calcHiddenCols(cols, outerWidth), [cols, outerWidth])
    const gridTemplateColumns = useMemo(() => getGridTemplateColumns(
        hideExpander(hasHiddenCols)(hideElementsForHiddenCols(false,col=>col.colKey)(cols))
    ), [cols, hideElementsForHiddenCols, hasHiddenCols])

    const { toExpanderElements, getExpandedCells } = useExpandedElements(expanded, setExpandedItem)

    const allChildren = useMemo(()=>getAllChildren({
        children,rows,cols,hasHiddenCols,hideElementsForHiddenCols,toExpanderElements,getExpandedCells
    }),[children,rows,cols,hasHiddenCols,hideElementsForHiddenCols,toExpanderElements,getExpandedCells])

    const dragRowKey = dragData.axis === "y" && dragData.dragKey
    useEffect(() => {
        if (dragRowKey) setExpandedItem(dragRowKey, v => false)
    }, [setExpandedItem, dragRowKey])

    const dragBGEl = $("div", { key: "gridBG", className: "gridBG", style: { gridColumn: spanAll, gridRow: spanAll }})
    const style = { display: "grid", gridTemplateRows, gridTemplateColumns }
    const res = $("div", { onMouseDown, style, className: "grid", ref: setGridElement }, dragBGEl, ...allChildren)
    const dragCSSEl = $("style",{dangerouslySetInnerHTML: { __html: dragCSSContent}})
    return $(NoCaptionContext.Provider,{value:true},dragCSSEl,res)
}

const getAllChildren = ({children,rows,cols,hasHiddenCols,hideElementsForHiddenCols,toExpanderElements,getExpandedCells}) => {
    const expandedElements = getExpandedCells({
        rows, children, cols: hideElementsForHiddenCols(true,col=>col.colKey)(cols),
    }).map(([rowKey, pairs]) => {
        const res = $(GridCell, {
            gridColumn: spanAll,
            rowKey,
            rowKeyMod: "-expanded",
            style: { display: "flex", flexFlow: "row wrap" },
            children: pairs.map(([col, cell]) => $("div",{
                key: cell.key,
                style: { flexBasis: `${col.width.min}em` },
                className: "inputLike",
                children: cell.props.children,
            }))
        })
        return $(NoCaptionContext.Provider,{value:false, key:`${rowKey}-expanded`},res)
    })
    const allChildren = toExpanderElements(hasHiddenCols,cols,hideElementsForHiddenCols(false,cell=>cell.props.colKey)([
        ...children, ...expandedElements
    ]))
    console.log("inner render")
    return allChildren
}

/*,(a,b)=>{    Object.entries(a).filter(([k,v])=>b[k]!==v).forEach(([k,v])=>console.log(k)) */

/// Highlighter, may be moved out

export function Highlighter({attrName, highlightClass: argHighlightClass, notHighlightClass: argNotHighlightClass}) {
    const [key,setKey] = useState(null)
    const [element,setElement] = useState(null)
    const move = useCallback(ev => {
        setKey(findFirstParent(el=>el.getAttribute(attrName))(ev.target))
    },[setKey])
    const highlightClass = argHighlightClass ? `[class~="${argHighlightClass}"]` : ''
    const notHighlightClass = argNotHighlightClass ? `:not([class~="${argNotHighlightClass}"])` : ''
    const style = key ? `div[${attrName}="${key}"]${highlightClass}${notHighlightClass}{background-color: var(--highlight-color);}` : ""
    const doc = element && element.ownerDocument
    useEventListener(doc, "mousemove", move)
    return $("style", { ref: setElement, dangerouslySetInnerHTML: { __html: style } })
}

///

export const components = {GridCell,GridRoot,Highlighter}
