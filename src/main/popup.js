
import {useState,useLayoutEffect,useCallback} from "react"
import {useAnimationFrame} from "../main/vdom-hooks.js"

const hiddenPosition = {position:"fixed",top:0,left:0,visibility:"hidden"}

const prepCheckUpdPopupPos = element => {
    if(!element) return was=>hiddenPosition
    const {width:popupWidth,height:popupHeight} =
        element.getBoundingClientRect()
    const {width:parentWidth,height:parentHeight,top:parentTop,left:parentLeft} =
        element.parentElement.getBoundingClientRect()
    const {clientWidth,clientHeight} = element.ownerDocument.documentElement
    const check = (isRight,top) => {
      const left = isRight ? parentWidth-popupWidth : 0
      const position = "absolute"
      const width = "max-content"
      const lr = isRight ? {right:0} : {left:0}
      return (
        parentLeft + left > 0 &&
        parentLeft + left + popupWidth < clientWidth &&
        parentTop + top > 0 &&
        parentTop + top + popupHeight < clientHeight ?
        {position,...lr,top,width} : null
      )
    }
    const pos =
        check(false,parentHeight) || check(true,parentHeight) ||
        check(false,-popupHeight) || check(true,-popupHeight) ||
        {
            position:"fixed",
            left: (clientWidth-popupWidth)/2,
            top: (clientHeight-popupHeight)/2,
            width: "fit-content"
        }
    return was => {
        const isSame =
            was.position === pos.position &&
            (was.left === pos.left || Math.abs(was.left-pos.left) < 0.5) &&
            was.right === pos.right &&
            (was.top === pos.top || Math.abs(was.top-pos.top) < 0.5)
        //const inUnCentering = was.position === "fixed" && pos.position === "absolute"
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