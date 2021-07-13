
import {createElement,useState,useContext,createContext,useCallback,useEffect} from "react"

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

export const extractedUse = (body,use) => (...args) => use(()=>body(...args),args)

export const useEventListener = extractedUse((el,evName,callback) => {
    if(!callback || !el) return undefined
    el.addEventListener(evName,callback)
    return ()=>el.removeEventListener(evName,callback)
},useEffect)

export const useAnimationFrame = extractedUse((element,callback) => {
    if(!callback || !element) return
    const {requestAnimationFrame,cancelAnimationFrame} = element.ownerDocument.defaultView
    const animate = () => {
        callback()
        req = requestAnimationFrame(animate,element)
    }
    let req = requestAnimationFrame(animate,element)
    return () => cancelAnimationFrame(req)
},useEffect)

export const NoCaptionContext = createContext()
