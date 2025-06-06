
import ReactDOM from "react-dom"
import React from "react"
const { createElement: $, useState, useMemo, cloneElement, useCallback, useEffect, useContext } = React

import { FilterArea, FilterButtonPlace } from "../main/vdom-filter.js"
import { FilterButtonExpander } from "../extra/massops/filter-button-expander"
import { PopupManager } from "../extra/popup-elements/popup-manager"
import { GridRoot, GridCell, Highlighter } from "../main/vdom-list.js"
import { createSyncProviders, NoCaptionContext } from "../main/vdom-hooks.js"
import "./style.scss"
import {InputLabel} from "../extra/InputWrapper.jsx"

const sumWidth = arr => arr.reduce((a,col)=>a+col.width.max,0)
const getMaxTableWidthWithout = (cols=[], hidedColNames=[]) => {
    return hidedColNames.length ? sumWidth(cols.filter(col=>!hidedColNames.some(hidedColname=>hidedColname===col.colKey))) : sumWidth(cols)
}

// mock

function ProjectCell() {
    const strs = ["CLDN Export", "DFDS Import", "CLDN Import", "Depot", "Line Equipment"]
    return getRandomText(strs)
}

function StockCell() {
    const strs = ["CLDN RO-RO SA", "DFDS Seaway", "DSV Road A/S"]
    return getRandomText(strs)
}
function NumMarkCell() {
    const strs = ["DSV9005", "BV9075", "BTEU3923433", "HAAU2611105", "DSV500225", "COMB2264114", "BTEU3909008", "DSV500236"]
    return getRandomText(strs)
}

function LocationCell() {
    const chips = [
        <div className="chipItem greenColor greenColor-text" key="locChip">LANE 0</div>,
        <div className="chipItem greenColor greenColor-text" key="locChip">Q</div>,
        <div className="chipItem greenColor greenColor-text" key="locChip">E27</div>,
        <div className="chipItem greenColor greenColor-text" key="locChip">E09</div>,
        <div className="chipItem greenColor-light greenColor-light-text" key="locChip">F46</div>,
        <div className="chipItem greenColor-light greenColor-light-text" key="locChip">K34</div>,
        <div className="chipItem greenColor-light greenColor-light-text" key="locChip">B44</div>,
        <div className="chipItem greenColor-light greenColor-light-text" key="locChip">G52</div>,
        <div className="chipItem redColor redColor-text" key="locChip">Loaded</div>,
        <div className="chipItem redColor redColor-text" key="locChip">450122</div>,
        <div className="chipItem redColor redColor-text" key="locChip">TORC790</div>,
    ]

    return chips[Math.floor(Math.random() * chips.length)]
}

function getRandomText(strs) {
    const index = Math.floor(Math.random() * strs.length)

    return <Text value={strs[index]} key="rndText" />
}

function ByCell() {
    const srlIcon = <ImageElement src="vdom-flist-servicerequestline.svg" className="rowIconSize" key="image1" />
    const srIcon = <ImageElement src="vdom-flist-servicerequestline.svg" className="rowIconSize" key="image2" />
    const meleq11Str = <Text value="MELEQ 11-Oct" key="text1" />
    const meleq18Str = <Text value="MELEQ 18-Oct" key="text2" />
    const stripAllStr = <Text value="Strip All" key="text3" />
    const vesselLoadStr = <Text value="Vessel load" key="text4" />
    const elements = [srlIcon, srIcon, meleq11Str, meleq18Str, stripAllStr, vesselLoadStr]
    const elemCount = 3//Math.floor(Math.random() * elements.length)
    let indexes = []
    for (var i = 0; i < elemCount; i++) indexes[i] = Math.floor(Math.random() * elements.length);
    const elementsToShow = elements.reduce((acc, curr, i) => {
        const includes = indexes.includes(i)
        const current = cloneElement(curr, { ...curr.props, key: i })
        return includes ? (acc ? [...acc, current] : [current]) : acc
    }, [])
    const finalElements = elementsToShow.reduce((acc, curr, i) => {
        const current = cloneElement(curr, { className: `${curr.props.className} descriptionRow` })

        return acc.length > 0 ? [...acc, <Text value=" ● " key={`del${i}`} />, current] : [current]
    }, [])
    const row = <div className="descriptionRow " key="row">{finalElements}</div>
    return row
}

function Text({ value, className }) {
    return <span className={`${className ? className : ''} text center`}>{value}</span>
}

function ButtonElement({ caption, BGcolor, onClick }) {
    return (
        <button className={`${BGcolor}Color`} onClick={onClick}>{caption}</button>
    )
}

function ExampleTextInput(inputKey){
    return $("input", {type:"text", key: inputKey})
}

function ExampleFilterItem({value, id}){
    const inputKey = value.toString().replaceAll(" ", "")+id
    const noCaption = useContext(NoCaptionContext)
    const input = ExampleTextInput(inputKey)
    return $(InputLabel,{caption:value, labelNeeded: !noCaption, isExpanded: noCaption, children: input, wrapperNeeded: true})
}

function ImageElement({src,className}){
    return $("img",{src,className,draggable:"false"})
}

// list

function VdomListElement({maxFilterAreaWidth, setMaxFilterAreaWidth, enableDrag, cols, setCols}) {
    const exCol =  (colKey, hideWill, min, max, caption) => ({
        colKey, hideWill, caption,
        width: { tp: "bound", min, max },
        ...(
            colKey === "expand" ? { isExpander: true } : {}
        )
    })

    useEffect(() => {
        setCols([
            exCol("icon", 2, 3, 5, "Icon"),
            exCol("c0", 1, 14, 30, "By"),
            exCol("expand", 0, 2, 2),
            exCol("c1", 1, 5, 10, "Project"),
            exCol("c2", 2, 5, 10, "Stock"),
            exCol("c3", 2, 15, 15, "Cargo"),
            exCol("c5", 3, 5, 10, "Out"),
            exCol("input", 2, 7, 10, "From"),
            exCol("c6", 2, 15, 30, "Remains"),
            exCol("c7", 2, 5, 10, "In"),
            exCol("c8", 1, 5, 10, "Container"),
            exCol("c9", 1, 7, 30, "Marking"),
            exCol("c10", 1, 7, 10, "Location"),
            enableDrag && exCol("drag", 0, 1.5, 3.5),
        ].filter(Boolean))
    }, [setCols, enableDrag])

    const exCell = rowKey => ({colKey, caption}) => {
        const key = ":" + rowKey + colKey
        return colKey==="drag" && rowKey === "drag" ? $("div", {className: "emptyCell", key: "emptyCell"}) : $(GridCell, {
            key, rowKey, colKey,
            ...(rowKey === "head" ? { className: "tableHeadContainer headerColor" } : {}),
            ...(rowKey === "drag" ? { dragHandle: "x", style: { userSelect: "none", cursor: "pointer" } } : {}),
            ...(colKey === "drag" ? { dragHandle: "y", style: { userSelect: "none", cursor: "pointer" } } : {}),
            ...(colKey === "expand" ? { expanding: "expander" } : {}),
            ...(colKey === "icon" ? { expanding: "none" } : {}),
            children: (
                rowKey === "head" ? (
                    colKey === "drag" || colKey === "expand" ? null : $(Text,{ key: "text", value: caption })
                ):
                rowKey === "drag" ? enableDrag && getColDragElement() :
                colKey === "expand" ? getExpanderElement() :
                colKey === "drag" ? enableDrag && getRowDragElement() :
                colKey === "input" ? $(ExampleInputLabel,{caption, inputKey: key}) :
                colKey === "icon" ? "I" :
                colKey === "c0" ? ByCell() :
                colKey === "c1" ? ProjectCell() :
                colKey === "c2" ? StockCell() :
                colKey === "c8" ? getCargoIconCell() :
                colKey === "c9" ? NumMarkCell() :
                colKey === "c10" ? LocationCell() :
                /*$(Text, {value:colKey+rowKey, key:"defaultCell"})*/ null
            )
        })
    }

    function getExpanderElement() {
        return $(
            "div",
            { className: "textLineSize absolutelyCentered expanderElementContainer", key: "expanderElem" },
            $(ImageElement, { color: "#90929F", className: "expanderElement", src: 'vdom-list-downarrowrow.svg' })
        )
    }

    function getColDragElement() {
        return $(ImageElement, { color: "adaptive", className: "dragElement", src: 'vdom-list-drag.svg' })
    }

    function getRowDragElement() {
        return $(ImageElement, { color: "adaptive", className: "dragElement", src: 'vdom-list-drag.svg' })
    }

    function ExampleInputLabel({caption, inputKey}){
        const noCaption = useContext(NoCaptionContext)
        const input = ExampleTextInput(inputKey)
        return $(InputLabel,{caption, labelNeeded: !noCaption, isExpanded: !noCaption, children: input, wrapperNeeded: true})
    }

    function getCargoIconCell() {
        return $(ImageElement, { className: "rowIconSize", src: 'vdom-flist-container.svg', key: "cargoIconCell" })
    }

    const rowKeys = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map(k => "r" + k)
    const byColumn = []

    useEffect(() => {
        setMaxFilterAreaWidth(getMaxTableWidthWithout(cols,["expand"]))
    }, [maxFilterAreaWidth, cols])

    /*useEffect(() => {
        const hidedColNames = []
        !enableDrag && hidedColNames.push("drag")
        /*!hasHiddenCols && hidedColNames.push("expand")*/
        /*setMaxFilterAreaWidth(getMaxTableWidthWithout(cols, hidedColNames))
    }, [enableDrag, maxFilterAreaWidth])*/

    const listEl = $(GridRoot, {
        key: "list",
        identity: {},
        cols,
        children: [
        ...(enableDrag ? cols.map(exCell("drag")).filter(Boolean) : []),
        ...cols.map(exCell("head")).filter(Boolean),
        ...rowKeys.flatMap(rowKey => cols.map(exCell(rowKey)).filter(Boolean)),
        ],
        rows: rowKeys.map(rowKey=>({rowKey})),
    })
    const children = [
        listEl,
        $(Highlighter,{key:"row-highlighter", attrName:"data-row-key"}),
        $(Highlighter,{key:"col-highlighter", attrName:"data-col-key"}),
        // <div className="test">test </div>
    ]

    const sender = { enqueue: () => { } }
    const ack = null
    const isRoot = true

    return createSyncProviders({ sender, ack, isRoot, children })

}

/******************************************************************************/

function ModeButton({ setState, dataKey, area, caption, BGcolor }) {
    const res = filterButton({ onClick: ev => setState(was => ({ ...was, [dataKey]: !was[dataKey] })), area, caption, BGcolor, key: dataKey }, dataKey)
    return res
}

function filterButton({ key, area, caption, onClick, BGcolor }) {
    const res = $(FilterButtonPlace, { key, area }, $(ButtonElement, { caption, onClick, BGcolor: BGcolor || "primary" }))
    return res
}

function App() {
    const [state, setState] = useState({})
    const [maxFilterAreaWidth, setMaxFilterAreaWidth] = useState(0)
    const [cols, setCols] = useState([])
    const { noFilters, showSome0, showSome1, enableDrag = true} = state
    const identities = useMemo(() => ({ lt: {}, rt: {} }), [])

   /* const expander = {
        children: [$("div", { key: "closedExpander", className: "exampleButton closedExpander" }, "v")],
        openedChildren: [$("div", { key: "openedExpander", className: "exampleButton openedExpander" }, "v")],
    }*/
    
    const expanderSVG = () => $(ImageElement, {src:"vdom-flist-filterbutton.svg", className:"filterButtonIcon", key:"filterbuttonFiltersImage", color:"#ffffff"})

    const expander = {
        children: [filterButton({ key: "closedExpander", className: "exampleButton closedExpander",
            caption: expanderSVG() })],
        openedChildren: [filterButton({ key: "openedExpander", className: "exampleButton openedExpander",
            caption: expanderSVG() })],
    }
    
    const dragOffClick = useCallback(() => {
        const hidedColNames = ["expand"]
        enableDrag && hidedColNames.push("drag")
        setMaxFilterAreaWidth(getMaxTableWidthWithout(cols, hidedColNames))
        setState(was => ({ ...was, enableDrag: !enableDrag }))
    }, [cols,setCols,enableDrag])

    return  $(PopupManager, {}, $(NoCaptionContext.Provider,{value:false,key:"filterArea"},
            $(FilterArea, {
            key: "app",
            maxFilterAreaWidth,
            filters: noFilters ? [] : [
                $(ExampleFilterItem, { key: 1, id: 1, value: "Number/Marking", children: "1 1", minWidth: 7, maxWidth: 10, canHide: !showSome1 }),
                $(ExampleFilterItem, { key: 2, id: 2, value: "Location", children: "2 0", minWidth: 10, maxWidth: 10, canHide: !showSome0 }),
                $(ExampleFilterItem, { key: 3, id: 3, value: "Location Feature", children: "3 0", minWidth: 7, maxWidth: 10, canHide: !showSome0 }),
                $(ExampleFilterItem, { key: 4, id: 4, value: "Mode", children: "4 0", minWidth: 5, maxWidth: 10, canHide: !showSome0 }),
                $(ExampleFilterItem, { key: 5, id: 5, value: "From", children: "5 1", minWidth: 5, maxWidth: 10, canHide: !showSome1 }),
            ],
            buttons: [
                $(FilterButtonExpander, {
                    key: 6, area: "lt", identity: identities.lt, ...expander, popupClassName: "gridPopup",  popupItemClassName: "popupItem", optButtons: [
                        ModeButton({ key: "show all 0", setState, dataKey: "showSome0", caption: "show all 0" }),
                        ModeButton({ key: "show all 1", setState, dataKey: "showSome1", caption: "show all 1"  }),
                        filterButton({ key: "dragOff", onClick: dragOffClick, caption: (enableDrag ? "disable" : "enable") + " drag",
                        BGcolor: enableDrag ? "lightPrimary" : "green" }),
                    ]
                }),
                filterButton({ key: 9, area: "lt", caption: "20" }),
                filterButton({ key: 0, area: "rt", caption: "of", BGcolor: "green" }),
                filterButton({ key: 10, area: "rt", caption: "20" }),
                ModeButton({ key: "noFilters", area: "rt", setState, dataKey: "noFilters", 
                caption: $(ImageElement, {src:"vdom-flist-hidefilters.svg", className:"hideFilterIcon", key:"hideFiltersImage", color:"#ffffff"}) }),
            ],
            className: "filterArea darkPrimaryColor",
        }),
        $(VdomListElement, {maxFilterAreaWidth, setMaxFilterAreaWidth, enableDrag, cols, setCols})
    ))
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)
