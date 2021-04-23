
import {useState,useLayoutEffect,useCallback} from "react"
import {useAnimationFrame} from "../main/vdom-hooks.js"

const hiddenPosition = {position:"fixed",top:0,left:0,visibility:"hidden"}

const {abs,min,max} = Math

const prepCheckUpdPopupPos = element => {
    if(!element) return was=>hiddenPosition
    const {width:popupWidth,height:popupHeight} =
        element.getBoundingClientRect()
    const {width:parentWidth,height:parentHeight,top:parentTop,left:parentLeft} =
        element.parentElement.getBoundingClientRect()
    const {clientWidth,clientHeight} = element.ownerDocument.documentElement
    const check = (left,top) => (
        left >= 0 && left <= clientWidth - popupWidth &&
        top  >= 0 && top <= clientHeight - popupHeight ?
        {position:"fixed",left,top,width:"max-content"} : null
    )
    const suggestRight =
        max(parentLeft+parentWidth*0.75, min(clientWidth, parentLeft+parentWidth))
    const pos =
        check(parentLeft,parentTop+parentHeight) || check(suggestRight-popupWidth,parentTop+parentHeight) ||
        check(parentLeft,parentTop-popupHeight)  || check(suggestRight-popupWidth,parentTop-popupHeight) ||
        {
            position:"fixed",
            left: (clientWidth-popupWidth)/2,
            top: (clientHeight-popupHeight)/2,
            width: "fit-content"
        }
    return was => {
        const isSame = abs(was.left-pos.left) < 0.5 && abs(was.top-pos.top) < 0.5
        return isSame ? was : pos
    }
}

const popupParentStyle = {position:"relative"}

export const usePopupPos = element => {
    const [position,setPosition] = useState(hiddenPosition)
    const checkUpdPos = useCallback(()=>{
        setPosition(prepCheckUpdPopupPos(element))
    },[element,setPosition])
    useLayoutEffect(()=>{ checkUpdPos() },[checkUpdPos])
    useAnimationFrame(element,checkUpdPos)
    return [position,popupParentStyle]
}