
import {useState,useLayoutEffect,useCallback} from "react"
import {useAnimationFrame} from "../main/vdom-hooks.js"

const hiddenPosition = {position:"fixed",top:0,left:0,visibility:"hidden"}

const rangeSw = (a,r,lim,b) => r < 0 ? a : r <= lim ? r : b

const makePosXY = (left,top) => !isNaN(left) && !isNaN(top) && {
    left, top, position:"fixed", width: "fit-content", /*?"max-content"*/
}
const makePosYX = (top,left) => makePosXY(left,top)

const fitTryAlign = ({lim,popupSize,parentFrom:from,parentSize}) => {
    const to = from + parentSize - popupSize
    return (
        rangeSw(NaN, from, lim, NaN) || rangeSw(NaN, to, lim, NaN) ||
        (rangeSw(0, from, lim, lim) + rangeSw(0, to, lim, lim)) / 2
    )
}
const fitNonOverlap = ({lim,popupSize,parentFrom,parentSize}) => (
    rangeSw(0, parentFrom + parentSize, lim, rangeSw(NaN, parentFrom - popupSize, lim, lim))
)
const fit2D = (prim, sec) => (
    prim.makePos(fitNonOverlap(prim), fitTryAlign(sec)) ||
    sec.makePos(fitNonOverlap(sec), fitTryAlign(prim)) ||
    prim.makePos(prim.lim/2, sec.lim/2)
)

const prepCheckUpdPopupPos = (element,lrMode) => {
    if(!element) return was=>hiddenPosition
    const {width:popupWidth,height:popupHeight} =
        element.getBoundingClientRect()
    const {width:parentWidth,height:parentHeight,top:parentTop,left:parentLeft} =
        element.parentElement.getBoundingClientRect()
    const {clientWidth,clientHeight} = element.ownerDocument.documentElement
    const xData = {
        lim: clientWidth - popupWidth, popupSize: popupWidth,
        parentFrom: parentLeft, parentSize: parentWidth, makePos: makePosXY,
    }
    const yData = {
        lim: clientHeight - popupHeight, popupSize: popupHeight,
        parentFrom: parentTop, parentSize: parentHeight, makePos: makePosYX,
    }
    const pos = lrMode ? fit2D(xData, yData) : fit2D(yData, xData)
    return was => {
        const isSame =
            Math.abs(was.left-pos.left) < 0.5 && Math.abs(was.top-pos.top) < 0.5
        return isSame ? was : pos
    }
}

const popupParentStyle = {}

export const usePopupPos = (element,lrMode) => {
    const [position,setPosition] = useState(hiddenPosition)
    const checkUpdPos = useCallback(()=>{
        setPosition(prepCheckUpdPopupPos(element,lrMode))
    },[element,setPosition,lrMode])
    useLayoutEffect(()=>{ checkUpdPos() },[checkUpdPos])
    useAnimationFrame(element,checkUpdPos)
    return [position,popupParentStyle]
}