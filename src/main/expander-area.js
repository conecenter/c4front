
import {createElement as $,useState,useLayoutEffect,useCallback,useMemo,useRef} from "react"
import {em} from "./vdom-util.js"
import {useEventListener,extractedUse} from "../main/vdom-hooks.js"
import {getFontSize,useWidths} from "../main/sizes.js"

const last = l => l && l.length>0 && l[l.length-1]

const gap = 1

const fitSide = (allItems,sideName,maxLineCount,align) => {
    const items = allItems.filter(item=>item.sideName===sideName)
    const getMinWidth = (itemsLeft,emptyLinesLeft,maxLineWidth,currentLineWidth,breaks) => {
        if(itemsLeft <= 0) {
            return maxLineWidth
        }
        const willCurrentLineWidth = currentLineWidth + items[itemsLeft-1].width
        const willMaxLineWidth = Math.max(willCurrentLineWidth, maxLineWidth)
        const aMinWidth = getMinWidth(itemsLeft-1,emptyLinesLeft,willMaxLineWidth,willCurrentLineWidth,breaks<<1)
        if(emptyLinesLeft <= 0 || currentLineWidth <= 0) return aMinWidth
        const bMinWidth = getMinWidth(itemsLeft,emptyLinesLeft-1,maxLineWidth,0,breaks|1)
        return Math.min(aMinWidth,bMinWidth)
    }
    const width =
        maxLineCount > 0 ? getMinWidth(items.length,maxLineCount-1,0,0,0) :
        items.length > 0 ? Infinity : 0
    return {width,items,align}
}

const fitSides = (items,lineCount,parentWidth) => {
    const ltSide = fitSide(items,"lt",lineCount,lineWidth=>0)
    const ctSide = fitSide(items,"ct",lineCount,lineWidth=>(parentWidth - lineWidth)/2)
    const rtSide = fitSide(items,"rt",lineCount,lineWidth=>(parentWidth - lineWidth))
    const widthLeftForSide =
        ctSide.width <= 0 ? parentWidth : (parentWidth-ctSide.width)/2 - gap
    const doesFit =
        ltSide.width <= widthLeftForSide &&
        rtSide.width <= widthLeftForSide &&
        ltSide.width + gap + rtSide.width <= parentWidth
    return { lineCount, sides: [ltSide,ctSide,rtSide], doesFit }
}

const getExpanded = item => item.props.expandTo
const getExpandOrder = item => item.props.expandOrder||0
const canBeExpanded = items => items.some(getExpanded)
const getAllExpanded = items => !canBeExpanded(items) ? items :
    [...items,...getAllExpanded(items.flatMap(item=>getExpanded(item)||[]))]
const getExpandedOrSelf = items => {
    const expandOrder = Math.min(...items.filter(getExpanded).map(getExpandOrder))
    return items.flatMap(item => getExpandOrder(item)===expandOrder && getExpanded(item) || [item])
}

const lineToEm = lineIndex => lineIndex*2

const getPositions = fitted => Object.fromEntries(fitted.sides.flatMap(side=>{
    const lines = side.items.reduce((lines,item) => {
        const lastLine = last(lines)
        const line = lastLine && lastLine.width + item.width <= side.width ? lastLine : {width:0,items:[]}
        return [...lines.filter(l=>l!==line), {
            width: line.width+item.width,
            items: [...line.items,{...item,lineLeft:line.width}]
        }]
    },[])
    return lines.flatMap((line,lineIndex)=>{
        const lineLeft = side.align(line.width)
        const top = lineToEm(lineIndex)
        return line.items.map(item=>[item.key,{top, left: lineLeft + item.lineLeft }])
    })
}))

const useSetViewportStateFromElement = extractedUse(setState => element => {
    const height = element ? parseInt(element.ownerDocument.documentElement.clientHeight / getFontSize(element)) : Infinity
    setState({element,height})
},useMemo)

const useViewportHeightIntEm = () => {
    const [{height,element},setState] = useState(Infinity)
    const set = useSetViewportStateFromElement(setState)
    const refresh = useCallback(()=>set(element),[set,element])
    const win = element && element.ownerDocument.defaultView
    useEventListener(win, "resize", refresh)
    return [height,set]
}

const deep = body => state => body(deep(body))(state)
//loop(next=>st=>{ console.log(st); if(st<10) next(st+1)})(0)

const useMemoFitAll = extractedUse((expandTo,childWidths,addPos,outerWidth,addContainer,checkLineCount) => {
    const setup = items => items.map(item=>({
        key: item.key, sideName: item.props.area, width: childWidths[item.key]
    })).filter(item=>item.width)
    const fitted =
        deep(nextExpanded=>localItems=>{
            if(!canBeExpanded(localItems)) return null
            const expandedItems = getExpandedOrSelf(localItems)
            const moreExpandedRes = nextExpanded(expandedItems)
            return moreExpandedRes || deep(nextLine=>lineCount=>{
                if(!checkLineCount(lineCount)) return null
                const res = fitSides(setup(expandedItems),lineCount,outerWidth)
                return res.doesFit ? res : nextLine(lineCount+1)
            })(0)
        })(expandTo) ||
        fitSides(setup(expandTo),1,outerWidth)
    const btnPosByKey = getPositions(fitted)
    const height = em(lineToEm(fitted.lineCount))
    const children = getAllExpanded(expandTo).map(c=>addPos(c.key,btnPosByKey[c.key],c.props.children))
    return addContainer(height,children)
},useMemo)

/*
const useLogDep = (hint,...depList) => {
    const ref = useRef(null)
    const changes = depList.flatMap((v,i)=>!(ref.current && ref.current[i]===v) ? [[i,v]] : [])
    if(changes.length > 0) console.log(hint,Object.fromEntries(changes))
    ref.current = depList
}
*/

export function ExpanderArea({expandTo,maxLineCount}){
    const [theAreaElement,setAreaElement] = useState(null)
    const [vpHeight,vpRef] = useViewportHeightIntEm()
    const [childWidths,addPos,outerWidth,addContainer] = useWidths(maxLineCount ? null : vpRef)
    const checkLineCountVP = useCallback(lineCount => lineToEm(lineCount) * 4 <= vpHeight, [vpHeight])
    const checkLineCountVal = useCallback(lineCount => lineCount <= maxLineCount, [maxLineCount])
    const checkLineCount = maxLineCount ? checkLineCountVal : checkLineCountVP
    const res = useMemoFitAll(expandTo,childWidths,addPos,outerWidth,addContainer,checkLineCount)
    // console.log("render "+maxLineCount)
    // useLogDep("changed "+maxLineCount,theAreaElement,childWidths,expandTo,outerWidth,childWidths,checkLineCount,vpHeight)
    return res
}
export function Expander({children}){ return children }

export const components = {ExpanderArea,Expander}