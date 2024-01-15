
import {createElement,useState,useMemo,useCallback,useLayoutEffect} from "react"
import {em} from "./vdom-util.js"
import {extractedUse,useEventListener} from "../main/vdom-hooks.js"


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

/********* multi common *******************************************************/

function Observed({observer,...props}){
    const ref = useObservedRef(observer)
    return createElement("div",{...props,ref})
}

/* eslint react/display-name: "off" */
const useAddObserved = extractedUse((observer,keyAttrName) => (key,attr) => createElement(Observed,{
    [keyAttrName]: key, observer, ...attr
}), useMemo)

const deleted = key => was => (
    key in was ?
        Object.fromEntries(Object.entries(was).filter(([k,v])=>k!==key)) : was
)

const useSizesFromElements = extractedUse((keyAttrName,singleSizeUpdater)=>(keep,element) => {
    const key = element.getAttribute(keyAttrName)
    if(!keep) return deleted(key)
    const update = singleSizeUpdater(element)
    return was => {
        const willV = update(was[key])
        return willV===was[key] ? was : {...was,[key]:willV}
    }
}, useMemo)

export const useObservedChildSizes = (keyAttrName,singleSizeUpdater) => {
    const [theSizes,setSizes] = useState({})
    const sizesFromElements = useSizesFromElements(keyAttrName, singleSizeUpdater)
    const observer = useResizeObserver(false,setSizes,sizesFromElements)
    const addObserved = useAddObserved(observer, keyAttrName)
    return [theSizes,addObserved]
}

/********* multi width ********************************************************/

const useAddPos = extractedUse(addObserved => (key,pos,children,className) => addObserved(key,{
    key, children,className,
    style: {
        position: "absolute", boxSizing: "border-box",
        top: em(pos?pos.top:0), left: em(pos?pos.left:0),
        visibility: pos?null:"hidden",
    }
}), useMemo)

const singleWidthUpdater = element => {
    const width = element.getBoundingClientRect().width / getFontSize(element)
    return was => width
}

const containerKeyAttrValue = "container"

const useAddContainer = extractedUse(addObserved=>(height,children,props={})=>addObserved(
    containerKeyAttrValue,
    { ...props, style: { position: "relative", height, ...props.style }, children }
), useMemo)

export const useWidths = () => {
    const [theWidths,addObserved] = useObservedChildSizes("data-width-key",singleWidthUpdater)
    const addPos = useAddPos(addObserved)
    //
    const addContainer = useAddContainer(addObserved)
    const containerWidth = theWidths[containerKeyAttrValue]
    return [theWidths,addPos,containerWidth,addContainer]
}

/********* viewport height ****************************************************/

const useSetViewportStateFromElement = extractedUse(setState => element => {
    const height = element ? parseInt(element.ownerDocument.documentElement.clientHeight / getFontSize(element)) : Infinity
    setState({element,height})
},useMemo)

export const useViewportHeightIntEm = () => { // !fix ref
    const [{height,element},setState] = useState(Infinity)
    const set = useSetViewportStateFromElement(setState)
    const refresh = useCallback(()=>set(element),[set,element])
    const win = element && element.ownerDocument.defaultView
    useEventListener(win, "resize", refresh)
    return [height,set]
}
