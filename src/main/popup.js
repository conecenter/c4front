
import {useState,useLayoutEffect,useCallback} from "react"
import {useAnimationFrame} from "../main/vdom-hooks.js"

const prepCheckUpdPopupPos = element => {
    if(!element) return was=>was
    const {width:popupWidth,height:popupHeight} =
        element.getBoundingClientRect()
    const {width:parentWidth,height:parentHeight,top:parentTop,left:parentLeft} =
        element.parentElement.getBoundingClientRect()
    const {clientWidth,clientHeight} = element.ownerDocument.documentElement
    const check = (left,top) => (
        parentLeft + left > 0 &&
        parentLeft + left + popupWidth < clientWidth &&
        parentTop + top > 0 &&
        parentTop + top + popupHeight < clientHeight ?
        {position:"absolute",left,top} : null
    )
    const pos =
        check(0,parentHeight) || check(parentWidth-popupWidth,parentHeight) ||
        check(0,-popupHeight) || check(parentWidth-popupWidth,-popupHeight) ||
        {
            position:"absolute",
            left: (clientWidth-popupWidth)/2-parentLeft,
            top: (clientHeight-popupHeight)/2-parentTop,
        }
    return was=>(
        Math.abs(was.top-pos.top) < 0.5 &&
        Math.abs(was.left-pos.left) < 0.5 ?
        was : pos
    )
}

const popupParentStyle = {position:"relative"}

export const usePopupPos = element => {
    const [position,setPosition] = useState({})
    const checkUpdPos = useCallback(()=>{
        setPosition(prepCheckUpdPopupPos(element))
    },[element,setPosition])
    useLayoutEffect(()=>{ checkUpdPos() },[checkUpdPos])
    useAnimationFrame(element,checkUpdPos)
    return [position,popupParentStyle]
}