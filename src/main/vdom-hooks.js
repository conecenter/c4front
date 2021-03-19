
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

export const useSyncWithState = (identity, defaultState) => {
    const [state, setState] = useState({...defaultState, patches: []})
    const sender = useSender()
    const setStateAndEnqueue = useCallback((changeState, {onAck, ...aPatch}) => {
        setState(prevState => ({
            ...changeState(prevState),
            patches: [...prevState.patches, {onAck, ...aPatch, sentIndex: sender.enqueue(identity, aPatch)}]
        }))
    }, [sender, identity])
    const ack = useContext(state.patches.length > 0 ? AckContext : NoContext)
    useEffect(() => {
        setState(prevState => {
            if (prevState.patches.every(nonMerged(ack))) return prevState.patches
            prevState.patches.forEach(p => nonMerged(ack)(p) || p.onAck && p.onAck())
            return prevState.patches.filter(nonMerged(ack))
        })
    }, [ack])
    return [state, setState, setStateAndEnqueue]
}

export function createSyncProviders({sender,ack,children}){
    return createElement(SenderContext.Provider, {value:sender},
        createElement(AckContext.Provider, {value:ack}, children)
    )
}

/********* stuff **************************************************************/

export const useWidth = element => {
    const [width,setWidth] = useState(Infinity)
    const resizeObserver = useMemo(()=>new ResizeObserver(entries => {
        const entry = entries[0]
        if(entry) {
            const {fontSize} = getComputedStyle(entry.target)
            setWidth(entry.contentRect.width / parseFloat(fontSize))
        }
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
