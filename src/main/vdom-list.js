import {cloneElement, createElement as $, useCallback, useEffect, useMemo, useState, useRef, useContext} from "react"
import clsx from 'clsx'

import {findFirstParent, identityAt, never, sortedWith} from "./vdom-util.js"
import {NoCaptionContext, RootBranchContext, useEventListener, useSync, usePath} from "./vdom-hooks.js"
import {useWidth,useMergeRef} from "./sizes.js"
import {useGridDrag} from "./grid-drag.js"
import {ESCAPE_KEY} from "./keyboard-keys"
import {useFocusControl} from "../extra/focus-control.ts"
import {BindGroupElement} from "../extra/binds/binds-elements"
import {useHoverExpander} from "../extra/hover-expander"
import {InputsSizeContext} from "../extra/dom-utils"
import {PrintContext} from "../extra/print-manager"
import {UiInfoContext} from "../extra/ui-info-provider"
import useResizeObserver from "@react-hook/resize-observer"

const dragRowIdOf = identityAt('dragRow')
const dragColIdOf = identityAt('dragCol')
const clickActionIdOf = identityAt('clickAction')
const keyboardActionIdOf = identityAt('keyboardAction')
const hasHiddenColsIdOf = identityAt('hasHiddenCols')

const ROW_KEYS = {
    HEAD: "head",
    DRAG: "drag",
}

const GRID_CLASS_NAMES = {
    CELL: "tableCellContainer headerColor-border",
}

const GRIDCELL_COLSPAN_ALL = 'gridcell-colspan-all'

const SERVICE_COLS = ['sel-col', 'expander-col']
const isServiceCol = colKey => SERVICE_COLS.some(key => colKey.includes(key))
const countServiceCols = cols => cols.filter(({colKey}) => isServiceCol(colKey)).length

//// col hiding

const partitionVisibleCols = (cols, outerWidth) => {
    const fit = (count, accWidth) => {
        const col = cols[count]
        if (!col) return count
        const willWidth = accWidth + col.width.min
        if (outerWidth < willWidth) return count
        return fit(count + 1, willWidth)
    }
    let count = fit(0, 0)
    // Avoid hiding last visible non-service column
    if (count - countServiceCols(cols.slice(0, count)) < 1) count += 1
    return [cols.slice(0, count), cols.slice(count)]
}

const sortedByHideWill = sortedWith((a, b) => a.hideWill - b.hideWill)

const calcHiddenCols = (cols, outerWidth, scrollbarAdjustment = 0) => {
    // ScrollbarAdjustment fixes resize infinite loop bug when cells sizes are dynamic
    const [visibleCols, hiddenCols] = partitionVisibleCols(sortedByHideWill(cols), outerWidth + scrollbarAdjustment)
    const hasHiddenCols = hiddenCols.length > 0
    const hiddenColSet = hasHiddenCols && new Set(colKeysOf(hiddenCols))
    const hideElementsForHiddenCols = (mode,toColKey) => (
        hasHiddenCols ? (children => children.filter(c => mode === hiddenColSet.has(toColKey(c)))) :
            mode ? (children => []) : (children => children)
    )
    return { hasHiddenCols, hideElementsForHiddenCols }
}

//// expanding

const getExpandedForRows = rows => Object.fromEntries(rows.filter(row=>row.isExpanded).map(row=>[row.rowKey,true]))

const setupExpanderElements = (rows, rowsWithHiddenContent, alwaysShowExpander) => {
    const expanded = getExpandedForRows(rows)
    return children => children.map(c => {
        const { expanding, rowKey } = c.props
        return expanding==="expander" && rowKey ? cloneElement(c, {
            expander: !(alwaysShowExpander || rowsWithHiddenContent.has(rowKey)) ? 'passive'
                : expanded[rowKey] ? 'expanded' : 'collapsed'
        }) : c
    })
}

const hideExpanderElements = cols => children => (
    colKeysOf(cols.filter(col=>col.isExpander))
        .reduce((resCells,expanderColKey)=>resCells.filter(cell=>cell.props.colKey!==expanderColKey), children)
)

const getExpandedCells = ({ cols, rows, children }) => {
        if (cols.length <= 0) return []
        const posStr = (rowKey, colKey) => rowKey + colKey
        const expanded = getExpandedForRows(rows)
        const expandedByPos = Object.fromEntries(
            children.filter(c => expanded[c.props.rowKey] && !c.props.expanding)
                .map(c => [posStr(c.props.rowKey, c.props.colKey), c])
        )
        return rows.filter(row => row.isExpanded).map(({rowKey}) => {
            const pairs = cols.map(col => {
                const cell = expandedByPos[posStr(rowKey, col.colKey)]
                return cell && [col, cell]
            }).filter(Boolean)
            return [rowKey, pairs]
        })
}

const expandRowKeys = rows => rows.flatMap(({rowKey,isExpanded}) => (
    isExpanded ? [{ rowKey }, { rowKey, rowKeyMod: "-expanded" }] : [{ rowKey }]
))

const hideExpander = hasHiddenCols => hasHiddenCols ? (l => l) : (l => l.filter(c => !c.isExpander))

//// main

const getGridRow = ({ rowKey, rowKeyMod }) => CSS.escape(rowKey + (rowKeyMod || ''))
const getGridCol = ({ colKey }) => colKey === GRIDCELL_COLSPAN_ALL ? spanAll : CSS.escape(colKey)

const hasOverflow = (elem) => elem && (elem.scrollWidth - elem.clientWidth) > 4 || false;

const spanAll = "1 / -1"

export function GridCell({ identity, children, rowKey, rowKeyMod, colKey, spanRight, spanRightTo, expanding, expander, dragHandle, noDefCellClass, classNames: argClassNames, gridRow: argGridRow, gridColumn: argGridColumn, needsHoverExpander=true, ...props }) {
    const ref = useRef(null)
    const path = usePath(identity)
    const gridRow = argGridRow || getGridRow({ rowKey, rowKeyMod })
    const gridColumn = argGridColumn || getGridCol({ colKey }) + (spanRightTo ? " / "+spanRightTo : "")
    const align = argClassNames?.includes('gridGoRight') ? 'r' : 'l';
    const {hoverStyle, hoverClass, ...hoverProps} = useHoverExpander(ref, align, needsHoverExpander);

    const [overflow, setOverflow] = useState(false);
    useResizeObserver(ref, (entry) => setOverflow(hasOverflow(entry.target)));

    const style = {...props.style, gridRow, gridColumn, ...hoverStyle}
    const expanderProps = expanding === "expander" && {
        'data-expander': expander,
        ...expander === 'passive' && {onClickCapture: (e) => e.stopPropagation()}
    }
    const {focusClass, focusHtml} = useFocusControl(path);
    const className = clsx(
        argClassNames, focusClass, hoverClass,
        !noDefCellClass && GRID_CLASS_NAMES.CELL,
        dragHandle && 'gridDragCell',
        overflow && 'overflownCell'
    );
    return $("div", {ref, ...props, ...expanderProps, 'data-col-key': colKey, 'data-row-key': rowKey, "data-drag-handle": dragHandle, ...focusHtml, style, className, ...hoverProps},
        gridColumn === spanAll ? $(NoCaptionContext.Provider, {value: false}, children) : children
    )
}

const colKeysOf = children => children.map(c => c.colKey)

const getGidTemplateRows = rows => rows.map(o => `[${getGridRow(o)}] auto`).join(" ")
const getGridTemplateColumns = (columns,fixedCellsSize) => {
    const lastVisibleCol = columns.length - countServiceCols(columns) === 1
    return columns.map(col => {
        const key = getGridCol(col)
        const getMaxStr = (width) =>
            width.tp === "bound" ? `${width.max}em` :
            width.tp === "unbound" ? "auto" : never()
        const width = (fixedCellsSize && !lastVisibleCol) || isServiceCol(col.colKey)
            ? `minmax(${col.width.min}em,${getMaxStr(col.width)})` : 'auto'
        return `[${key}] ${width}`
    }).join(" ")
}

//todo: for multi grids with overlapping keys per page implement: rootSelector
// see: x-r-sort-obj-key x-r-sort-order-*

const useSyncGridDrag = ({ identity, rows, cols, gridKey }) => {
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
    const dragStyles = useMemo(()=>({
        rootSelector: `div[data-grid-key="${gridKey}"]`,
        bgSelector: ".gridBG",
        dropRoot: "background-color: var(--grid-drop-color)",
        dropItem: "background-color: var(--grid-drop-color)",
        dragItem: "opacity: 50%; z-index:1000",
    }),[gridKey])
    const [dragCSSContent,onMouseDown] = useGridDrag(dragData,setDragData,dragStyles,checkDrop)
    return [dragData,dragCSSContent,onMouseDown]
}

const useColumnGap = () => { // will not react to element style changes
    const [columnGap,setColumnGap] = useState(0)
    const ref = useCallback(gridElement=>{
        if(!gridElement) return;
        const {columnGap,fontSize} = getComputedStyle(gridElement)
        const columnGapF = parseFloat(columnGap)
        setColumnGap( isNaN(columnGapF) ? 0 : columnGapF/parseFloat(fontSize) )
    },[setColumnGap])
    return [columnGap,ref]
}

const useScrollbarWidth = (outerWidth,fixedCellsSize) => {
    const scrollbarWidth = useRef(0)
    const calcScrollbarWidth = elem => {
        const {fontSize} = getComputedStyle(elem)
        const {defaultView: win, documentElement} = elem.ownerDocument
        return (win.innerWidth - documentElement.clientWidth) / parseFloat(fontSize)
    }
    const ref = useCallback(gridElement=>{
        if (gridElement) scrollbarWidth.current = calcScrollbarWidth(gridElement)
    },[outerWidth])
    return fixedCellsSize ? [] : [scrollbarWidth.current,ref]
}

const getCellDataAttrs = element => {
    const rowKey = element.getAttribute("data-row-key")
    const colKey = element.getAttribute("data-col-key")
    return rowKey && colKey ? {rowKey, colKey} : null
}

const useGridClickAction = identity => {
    const [clickActionPatches, enqueueClickActionPatch] = useSync(clickActionIdOf(identity))
    return useCallback(ev => {
        if (ev.target.closest('.checkBox, button') || ev.ctrlKey && ev.target.closest('.chipItem')) return;
        const cellDataKeys = findFirstParent(getCellDataAttrs)(ev.target)
        if (cellDataKeys && cellDataKeys.rowKey && cellDataKeys.colKey) {
            const headers = {
                "x-r-row-key": cellDataKeys.rowKey,
                "x-r-col-key": cellDataKeys.colKey,
                "x-r-ctrl-key": ev.ctrlKey ? "1" : "0",
                "x-r-shift-key": ev.shiftKey ? "1" : "0",
            }
            enqueueClickActionPatch({headers})
        }
    }, [enqueueClickActionPatch])
}

const useGridKeyboardAction = identity => {
    const [_, enqueueKeyboardActionPatch] = useSync(keyboardActionIdOf(identity));
    return useCallback(ev => {
        if (ev.key === ESCAPE_KEY) {
            const headers = {"x-r-escape-key": "1"}
            enqueueKeyboardActionPatch({headers})
        }
    }, [enqueueKeyboardActionPatch])
}

const useValueToServer = (identity, value, hasReceiver) => {
    const {isRoot} = useContext(RootBranchContext)
    const [patches, enqueuePatch] = useSync(identity)
    useEffect(() => {
        if (hasReceiver && isRoot) enqueuePatch({ value, skipByPath: true, retry: true })
    }, [value, enqueuePatch, hasReceiver, isRoot])
}

export function GridRoot({
    identity,
    rows: argRows,
    cols: argCols,
    children: rawChildren = [],
    gridKey,
    alwaysShowExpander,
    hasHiddenCols: hasHiddenColsReceiver, 
    rowHeightMultiplier = 1
}) {
    const printMode = useContext(PrintContext);
    const rows = printMode ? argRows.map(row => ({...row, isExpanded: true})) : argRows
    const cols = printMode
        ? argCols
            .filter(col => !isServiceCol(col.colKey))
            .map((col, i, arr) => (i === arr.length - 1) ? { ...col, width: { ...col.width, tp: "unbound" }} : col)
        : argCols

    const children = printMode ? rawChildren.filter(child => !isServiceCol(child.props.colKey)) : rawChildren

    const uiType = useContext(UiInfoContext)
    const fixedCellsSize = uiType === 'pointer'

    const [dragData,dragCSSContent,onMouseDown] = useSyncGridDrag({ identity, rows, cols, gridKey })
    const clickAction = useGridClickAction(identity)
    const keyboardAction = useGridKeyboardAction(identity)

    const hasDragRow = useMemo(()=>children.some(c=>c.props.dragHandle==="x"),[children])
    const gridTemplateRows = useMemo(() => getGidTemplateRows([
        ...(hasDragRow ? [{ rowKey: ROW_KEYS.DRAG }]:[]),
        { rowKey: ROW_KEYS.HEAD },
        ...expandRowKeys(rows)
    ]), [hasDragRow, rows])

    const [outerWidth,outerWidthRef] = useWidth()
    const [columnGap,columnGapRef] = useColumnGap()
    const [scrollbarWidth,scrollbarWidthRef] = useScrollbarWidth(outerWidth,fixedCellsSize)
    const ref = useMergeRef(outerWidthRef,columnGapRef,scrollbarWidthRef)

    const contentWidth = outerWidth - columnGap * cols.length
    const { hasHiddenCols, hideElementsForHiddenCols } =
        useMemo(() => calcHiddenCols(cols, contentWidth, scrollbarWidth), [cols, contentWidth])
    const gridTemplateColumns = useMemo(() => getGridTemplateColumns(
        hideExpander(hasHiddenCols || alwaysShowExpander)(hideElementsForHiddenCols(false,col=>col.colKey)(cols)),
        fixedCellsSize
    ), [cols, hideElementsForHiddenCols, hasHiddenCols, alwaysShowExpander, fixedCellsSize])

    useValueToServer(hasHiddenColsIdOf(identity), hasHiddenCols, hasHiddenColsReceiver)

    const dragRowKey = dragData.axis === "y" && dragData.drag && dragData.drag.key
    //todo: fix expand+drag -- may be prepend with bg-cell with rowspan 2

    const allChildren = useMemo(()=>getAllChildren({
        children,rows,cols,hasHiddenCols,alwaysShowExpander,hideElementsForHiddenCols,dragRowKey
    }),[children,rows,cols,hasHiddenCols,alwaysShowExpander,hideElementsForHiddenCols,dragRowKey,printMode])

    const headerRowKeys = rows.filter(row => row.isHeader).map(row => row.rowKey).join(' ')
    const dragBGEl = $("div", { key: "gridBG", className: "gridBG", style: { gridColumn: spanAll, gridRow: spanAll }})
    const style = {
        display: "grid",
        gridTemplateRows,
        gridTemplateColumns,
        '--row-height-multiplier': rowHeightMultiplier
    }
    const res = $("div", {
        onMouseDown,
        onClickCapture: clickAction,
        onKeyDown: keyboardAction,
        style,
        className: clsx("grid", fixedCellsSize ? 'fixedCells' : 'dynamicCells'),
        "data-grid-key": gridKey,
        "header-row-keys": headerRowKeys,
        ref
    }, dragBGEl, ...allChildren)

    const dragCSSEl = $("style",{dangerouslySetInnerHTML: { __html: dragCSSContent}})

    return $(NoCaptionContext.Provider,{value:true},
            $(InputsSizeContext.Provider,{value: fixedCellsSize ? 50 : 25},
                $(BindGroupElement,{groupId:'grid-list-bind'},dragCSSEl,res)))
}

const getAllChildren = ({children,rows,cols,hasHiddenCols,alwaysShowExpander,hideElementsForHiddenCols,dragRowKey}) => {
    const rowsWithHiddenContent = new Set();
    hideElementsForHiddenCols(true,c=>c.props.colKey)(children).forEach(cell => {
        if (cell.props.children) rowsWithHiddenContent.add(cell.props.rowKey);
    });
    const expandedElements = getExpandedCells({
        cols: hideElementsForHiddenCols(true,col=>col.colKey)(cols),
        rows: rows.filter(row => rowsWithHiddenContent.has(row.rowKey)),
        children,
    }).map(([rowKey, pairs]) => $(GridCell, {
            key:`${rowKey}-expanded`,
            gridColumn: spanAll,
            rowKey, rowKeyMod: "-expanded",
            'data-expanded-cell': '',
            style: dragRowKey ? {visibility: "hidden"} : undefined,
            needsHoverExpander: false,
            children: $(NoCaptionContext.Provider, {value:false}, pairs.map(([col, cell]) => cell.props.children))
        }))
    const toExpanderElements = alwaysShowExpander || hasHiddenCols
        ? setupExpanderElements(rows, rowsWithHiddenContent, alwaysShowExpander) : hideExpanderElements(cols)
    const allChildren = spanRightElements(cols, toExpanderElements(hideElementsForHiddenCols(false,cell=>cell.props.colKey)([
        ...children, ...expandedElements
    ])))
    console.log("inner render "+dragRowKey)
    return allChildren
}

const spanRightElements = (cols,children) => {
    if(!children.some(c=>c.props.spanRight)) return children
    const colKeys = colKeysOf(cols)
    const colKeyIndexes = Object.fromEntries(colKeys.map((k,i)=>[k,i]))
    const toKey = (c,i) => c.props.rowKey+" "+i
    const toColN = c => colKeyIndexes[c.props.colKey]
    const hasChild = new Set(children.map(c=>toKey(c,toColN(c))))
    const findNext = (c,i) => (
        i >= colKeys.length ? "-1" : hasChild.has(toKey(c,i)) ? getGridCol({ colKey: colKeys[i] }) : findNext(c,i+1)
    )
    return children.map(c => !c.props.spanRight ? c : cloneElement(c, { spanRightTo: findNext(c, toColN(c)+1) }))
}

/*,(a,b)=>{    Object.entries(a).filter(([k,v])=>b[k]!==v).forEach(([k,v])=>console.log(k)) */

/// Highlighter, may be moved out
export function Highlighter({attrName, highlightClass: argHighlightClass, notHighlightClass: argNotHighlightClass, gridKey}) {
    const [key,setKey] = useState(null)
    const [element,setElement] = useState(null)
    const gridSelector = gridKey ? `[data-grid-key="${gridKey}"]` : ''
    const move = useCallback(ev => {
        if (gridSelector && !ev.target.matches(`${gridSelector} :scope`)) setKey(null);
        else setKey(findFirstParent(el=>el.getAttribute(attrName))(ev.target))
    }, [setKey,gridKey])
    const elemSelector = argHighlightClass ? `.${argHighlightClass}` : 'div'
    const notHighlightClass = argNotHighlightClass ? `:not(.${argNotHighlightClass})` : ''
    const style = key
        ? `${gridSelector} ${elemSelector}[${attrName}="${key}"]${notHighlightClass}
            { background-color: var(--highlight-color); }`
        : ""
    const doc = element && element.ownerDocument
    useEventListener(doc, "mousemove", move)
    return $("style", { ref: setElement, dangerouslySetInnerHTML: { __html: style } })
}

///

export const components = {GridCell,GridRoot,Highlighter}
