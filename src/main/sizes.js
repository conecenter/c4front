
import {createElement,useState,useMemo,useCallback,useLayoutEffect} from "react"
import {em} from "./vdom-util.js"
import {extractedUse} from "../main/vdom-hooks.js"


/********* ResizeObserver *****************************************************/

export const getFontSize = element => parseFloat(getComputedStyle(element).fontSize)

const getWidthEm = el => el.getBoundingClientRect().width / getFontSize(el)

const useResizeObserver = extractedUse((isInstant,set,transform) => {
    const inner = new ResizeObserver(entries => {
        entries.forEach(entry=>upd(entry.target)) // seems entry.contentRect.width was lass than BoundingRect
    })
    const observe = element => {
        if(!element) return undefined
        if(isInstant) upd(element)
        inner.observe(element)
        return () => {
            inner.unobserve(element)
            set(transform(false,element))
        }
    }
    const upd = element => element && set(transform(true,element))
    return {observe,upd}
},useMemo)

const useObserved =
    extractedUse((observer,element) => observer.observe(element), useLayoutEffect)
const useObservedRef = observer => {
    const [element,setElement] = useState(null)
    useObserved(observer,element)
    return useMergeRef(observer.upd, setElement)
}

export const useMergeRef =
    (...refs) => useCallback(element=>refs.forEach(ref=>ref && ref(element)),refs)

/********* single width *******************************************************/

const widthFromElement = (keep,element) => keep ? getWidthEm(element) : Infinity
export const useWidth = () => {
    const [width,setWidth] = useState(Infinity)
    const observer = useResizeObserver(true,setWidth,widthFromElement)
    const ref = useObservedRef(observer)
    return [width,ref]
}

/********* multi width ********************************************************/

function Observed({observer,...props}){
    const ref = useObservedRef(observer)
    return createElement("div",{...props,ref})
}

const useAddPos = extractedUse((observer) => (key,pos,children,className) => createElement(Observed,{
    key, [keyAttrName]: key, observer, children, className,
    style: {
        position: "absolute", boxSizing: "border-box",
        top: em(pos?pos.top:0), left: em(pos?pos.left:0),
        visibility: pos?null:"hidden",
    }
}), useMemo)

const deleted = key => was => (
    key in was ?
        Object.fromEntries(Object.entries(was).filter(([k,v])=>k!==key)) : was
)

const keyAttrName = "data-width-key"

const widthsFromElement = (keep,element) => {
    const key = element.getAttribute(keyAttrName)
    if(!keep) return deleted(key)
    const width = element.getBoundingClientRect().width / getFontSize(element)
    return was => {
        const d = width - (key in was ? was[key] : 0) //Math.abs(d)<0.2
        return d==0 ? was : {...was,[key]:width}
    }
}

const containerKeyAttrValue = "container"

const useAddContainer = extractedUse((ref,keyAttrValue)=>(height,children,className)=>{
    const style = { position: "relative", height }
    return createElement("div",{ style, ref, className, [keyAttrName]:containerKeyAttrValue, children })
},useMemo)

export const useWidths = nextRef => {
    const [theWidths,setWidths] = useState({})
    const observer = useResizeObserver(false,setWidths,widthsFromElement)
    const addPos = useAddPos(observer)
    //
    const ref = useObservedRef(observer)
    const addContainer = useAddContainer(useMergeRef(ref,nextRef))
    const containerWidth = theWidths[containerKeyAttrValue]
    return [theWidths,addPos,containerWidth,addContainer]
}
/* addChildPos useChildWidths em */
