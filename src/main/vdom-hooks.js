
import {createElement,useState,useMemo,useLayoutEffect,useContext,createContext,useCallback,useEffect} from "react"

/********* sync ***************************************************************/

const NoContext = createContext()
const AckContext = createContext()
const SenderContext = createContext()
const nonMerged = ack => aPatch => !(aPatch && ack && aPatch.sentIndex <= ack.index)
export const useSender = () => useContext(SenderContext)
export const useSync = identity => {
    const [patches,setPatches] = useState([])
    const sender = useSender()
    const enqueuePatch = useCallback(({onAck,...aPatch})=>{
        setPatches(aPatches=>[...aPatches,{onAck, ...aPatch, sentIndex: sender.enqueue(identity,aPatch)}])
    },[sender,identity])
    const ack = useContext(patches.length>0 ? AckContext : NoContext)
    useEffect(()=>{
        setPatches(aPatches => {
            if(aPatches.every(nonMerged(ack))) return aPatches
            aPatches.forEach(p=>nonMerged(ack)(p) || p.onAck && p.onAck())
            return aPatches.filter(nonMerged(ack))
        })
    },[ack])
    return [patches,enqueuePatch]
}

export function createSyncProviders({sender,ack,children}){
    return createElement(SenderContext.Provider, {value:sender},
        createElement(AckContext.Provider, {value:ack}, children)
    )
}

/********* stuff **************************************************************/

export const getFontSize = element => parseFloat(getComputedStyle(element).fontSize)

export const useWidth = element => {
    const [width,setWidth] = useState(Infinity)
    const resizeObserver = useMemo(()=>new ResizeObserver(entries => {
        entries.forEach(entry=>{
            setWidth(entry.contentRect.width / getFontSize(entry.target))
        })
    }))
    useLayoutEffect(()=>{
        element && resizeObserver.observe(element)
        return () => element && resizeObserver.unobserve(element)
    },[element])
    return width
}

export const useEventListener = (el,evName,callback) => {
    useEffect(()=>{
        if(!callback || !el) return undefined
        el.addEventListener(evName,callback)
        return ()=>el.removeEventListener(evName,callback)
    },[el,evName,callback])
}

export const useAnimationFrame = (element,callback) => {
    useEffect(() => {
        if(!callback || !element) return
        const {requestAnimationFrame,cancelAnimationFrame} = element.ownerDocument.defaultView
        const animate = () => {
            callback()
            req = requestAnimationFrame(animate,element)
        }
        let req = requestAnimationFrame(animate,element)
        return () => cancelAnimationFrame(req)
    },[element,callback])
}

export const NoCaptionContext = createContext()

const em = v => `${v}em`
export const addChildPos = (key,pos,children) => createElement("div",{
    key, "data-child-key": key, children,
    style: {
        /*height:"2em",*/ position: "absolute", boxSizing: "border-box",
        top: em(pos?pos.top:0), left: em(pos?pos.left:0),
        visibility: pos?null:"hidden",
    }
})
const prepCheckUpdChildWidths = parentElement => {
    if(!parentElement) return
    const widths = [...parentElement.children].map(el=>{
        const key = el.getAttribute("data-child-key")
        return key && [key, el.getBoundingClientRect().width / getFontSize(parentElement)]
    }).filter(Boolean)
    return was=>(
        widths.every(([key,width]) => width - (key in was ? was[key] : 0) <= 0) ?
            was : Object.fromEntries(widths)
    )
}
export const useChildWidths = (parentElement,depList) => {
    const [theWidths,setWidths] = useState({})
    useLayoutEffect(()=>{
        if(parentElement) setWidths(prepCheckUpdChildWidths(parentElement))
    },[parentElement,setWidths,...depList]) // ? are all child elements ready ; do we miss some due to these deps ?
    return theWidths
}