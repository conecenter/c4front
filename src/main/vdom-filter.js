
import {createElement as $,useState,useContext,createContext,useCallback,cloneElement,useMemo} from "react"
import {em,sum} from "./vdom-util.js"
import {useWidths} from "../main/sizes.js"
import {usePopupPos,usePopupMiss} from "../main/popup.js"
import { NoCaptionContext } from "./vdom-hooks.js"

//// non-shared

const fitButtonsSide = (allButtons,sideName,isExpanded,isMultiline) => {
    const {list,getWidth} = allButtons
    const isInOptLine = c => isMultiline && c.props.optButtons
    const condExpand = c => isExpanded && c.props.optButtons ? c.props.optButtons : [c]
    const sideButtons = list.filter(c => c.props.area===sideName)
    const buttons = sideButtons.filter(c => !isInOptLine(c)).flatMap(condExpand)
    const optButtons = sideButtons.filter(isInOptLine).flatMap(condExpand)
    const centralWidth = sideName === "rt" ? getWidth(buttons.slice(0,1)) : 0
    const width = Math.max(getWidth(buttons), centralWidth+getWidth(optButtons))
    return {width,buttons,optButtons}
}

const getVisibleFilters = (filters,hideEmptyFromIndex) => filters.filter(
    (c,j) => !c.props.canHide || j < hideEmptyFromIndex
)

const replaced = (wasItem,willItem) => l => l.map(item=>item===wasItem?willItem:item)

const doFitFilters = (filters,resTemplate) => {
    const fit = (res,filter) => {
        if(!res) return null
        const w = filter.props.minWidth
        const row = res.find(row=>row.leftWidth>=w)
        if(!row) return null
        const leftWidth = row.leftWidth-w
        const items = [...row.items,filter]
        return replaced(row,{leftWidth,items})(res)
    }
    const inner = (hideEmptyFromIndex,fallback) => {
        if(hideEmptyFromIndex > filters.length) return fallback
        const groupedFilters = getVisibleFilters(filters,hideEmptyFromIndex).reduce(fit, resTemplate)
        if(!groupedFilters) return fallback
        return inner(hideEmptyFromIndex+1,groupedFilters)
    }
    const res = inner(0,null)
    return res
}

const emPerRow = 2

const fitFilters = (filters,outerWidth,rowCount,canReduceButtonWidth,isMultilineButtons,lt,rt) => {
    if(filters.length > 0 && rowCount <= 1 && !isMultilineButtons) return null
    const allButtonWidth = lt.width + rt.width
    const fitWidth = isMultilineButtons ? Math.max(0, outerWidth - allButtonWidth) : 0
    if(canReduceButtonWidth && outerWidth < allButtonWidth ) return null

    const minOuterWidth = //isExpanded ? outerWidth :
        Math.max(outerWidth,allButtonWidth,...getWidthLimits(filters))

    const resTemplate = [...Array(rowCount)].map((u,j)=>({
        items: [], leftWidth: j===0 ? fitWidth : minOuterWidth
    }))
    const groupedFilters = doFitFilters(filters,resTemplate)
    return groupedFilters && {groupedFilters,lt,rt}
}

const getWidthLimits = filters => getVisibleFilters(filters,0).map(c=>c.props.minWidth)

const fitRows = (filters,buttons,outerWidth,rowCount) => outerWidth ? (
    fitFilters(filters, outerWidth, rowCount, true ,false, fitButtonsSide(buttons,"lt",true ,false), fitButtonsSide(buttons,"rt",true ,false)) ||
    fitFilters(filters, outerWidth, rowCount, true ,false, fitButtonsSide(buttons,"lt",true ,false), fitButtonsSide(buttons,"rt",false,false)) ||
    fitFilters(filters, outerWidth, rowCount, true ,false, fitButtonsSide(buttons,"lt",false,false), fitButtonsSide(buttons,"rt",false,false)) ||
    fitFilters(filters, outerWidth, rowCount, true ,true , fitButtonsSide(buttons,"lt",true ,true ), fitButtonsSide(buttons,"rt",true ,true )) ||
    fitFilters(filters, outerWidth, rowCount, true ,true , fitButtonsSide(buttons,"lt",true ,true ), fitButtonsSide(buttons,"rt",false,true )) ||
    fitFilters(filters, outerWidth, rowCount, false,true , fitButtonsSide(buttons,"lt",false,true ), fitButtonsSide(buttons,"rt",false,true )) ||
    fitRows(filters,buttons,outerWidth,rowCount+1)
) : { groupedFilters: [], lt: fitButtonsSide(buttons,"lt",false,true ), rt: fitButtonsSide(buttons,"rt",false,true ) }

const dMinMax = el => el.props.maxWidth - el.props.minWidth

export function FilterArea({filters,buttons,className/*,maxFilterAreaWidth*/}){
    const [btnWidths,addPos,outerWidth,addContainer] = useWidths()
    const getButtonWidth = item => btnWidths[item.key]||0
    const getButtonsWidth = items => sum(items.map(getButtonWidth))

    const {groupedFilters,lt,rt} = fitRows(filters||[],{list:buttons||[],getWidth:getButtonsWidth},outerWidth,1)
    const dnRowHeight = groupedFilters && groupedFilters[0] && groupedFilters[0].items.length>0 || lt.optButtons.length + rt.optButtons.length > 0 ? emPerRow : 0
    const yRowToEm = h => em(h * emPerRow*2 - emPerRow + dnRowHeight)

    const filterGroupElements = groupedFilters.flatMap(({items,leftWidth},rowIndex)=>{
        const proportion = Math.min(1,leftWidth/sum(items.map(dMinMax)))
        const getWidth = item => item.props.minWidth+dMinMax(item)*proportion
        return items.map((item,itemIndex)=>$("div",{ key:item.key, style:{
            position: "absolute",
            height: em(emPerRow*2),
            top: yRowToEm(rowIndex),
            width: em(getWidth(item)),
            left: em(sum(items.slice(0,itemIndex).map(getWidth))),
            boxSizing: "border-box",
        }},item))
    })

    const centerWidth = getButtonsWidth(rt.buttons.slice(0,1))
    const btnPosByKey = Object.fromEntries([
        ...lt.buttons.map((item,itemIndex,items)=>[   item.key,0       , outerWidth-rt.width-getButtonsWidth(items.slice(itemIndex))]),
        ...lt.optButtons.map((item,itemIndex,items)=>[item.key,emPerRow, outerWidth-rt.width-getButtonsWidth(items.slice(itemIndex))]),
        ...rt.buttons.map((item,itemIndex,items)=>[   item.key,0       , outerWidth-rt.width+getButtonsWidth(items.slice(0,itemIndex))]),
        ...rt.optButtons.map((item,itemIndex,items)=>[item.key,emPerRow, outerWidth-rt.width+centerWidth+getButtonsWidth(items.slice(0,itemIndex))]),
    ].map((([key,top,left])=>[key,{top,left}])))

    const btnElements =
        (buttons || []).flatMap(c => [c,...(c.props.optButtons||[])])
        .map(c=>addPos(c.key,btnPosByKey[c.key],cloneElement(c,{getButtonWidth})))

    const children = [...filterGroupElements,...btnElements]
    /* maxWidth: maxFilterAreaWidth ? em(maxFilterAreaWidth) : "100vw"*/
    const height = yRowToEm(groupedFilters.length)
    return $(NoCaptionContext.Provider, {value: true},
        $("div",{className},addContainer(height,children)))
}

////


const popupAttrName = "data-is-popup"
const popupSkipValue = "1"
const PopupContext = createContext()
const usePopupState = identity => {
    const [popup,setPopup] = useContext(PopupContext)
    const isOpened = useCallback(p => p===identity, [identity])
    const setOpened = useCallback(on => setPopup(on?identity:null), [setPopup,identity])
    return [isOpened(popup),setOpened]
}

export function PopupManager({children}){
    const [popup,setPopup] = useState(null) // todo useSync
    const onPopupMiss = useCallback(()=>setPopup(was=>null),[setPopup])
    const el = usePopupMiss(popupAttrName,popupSkipValue,onPopupMiss)
    const value = useMemo(()=>[popup,setPopup],[popup,setPopup])
    return $(PopupContext.Provider,{value},[...children,el])
}

export function FilterButtonExpander({identity,optButtons:rawOptButtons,className,children,openedChildren,getButtonWidth}){
    const optButtons = rawOptButtons || []
    const [popupElement,setPopupElement] = useState(null)
    const [popupStyle] = usePopupPos(popupElement)
    const width = em(Math.max(...optButtons.map(getButtonWidth)))
    const [isOpened,toggle] = usePopupState(identity)

    return $("div",
        {
            className, style:{maxHeight:"2em"}, 
            [popupAttrName]:popupSkipValue,
            onClick: ev => toggle(!isOpened)
        },
        isOpened ? [
            openedChildren ?? children,
            $("div",{key:"popup",className:'popupEl',style:{...popupStyle,width},ref:setPopupElement},optButtons.map(btn=>{
                return $("div",{ key: btn.key, className:'gridPopupItem' }, btn.props.children)
            }))
        ] : children
    )
}

export function FilterButtonPlace({className,children}){
    return $("div",{className,style:{height:"2em"}},children)
}

export function FilterItem({className,children}){
    return $(NoCaptionContext.Provider, {value: false},
        $("div",{className},children))
}

export const components = {FilterArea,FilterButtonExpander,FilterButtonPlace,FilterItem,PopupManager}