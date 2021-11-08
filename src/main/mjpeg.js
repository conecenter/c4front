
import {createElement,useState,useEffect,useCallback} from "react"

import {useAnimationFrame,extractedUse} from "./vdom-hooks.js"

const now = () => Date.now()

const useConnectedInner = extractedUse((setConnected,url,cb) => {
    if(!cb) return
    const ws = new WebSocket(url)
    setConnected({at:now()})
    ws.onmessage = ev => {
        //console.log(ev)
        if(ev.data) cb(ev.data)
        const at = now()
        setConnected(was => was && ws === was.ws && at < was.at+1000 ? was : {at,ws})
    }
    return ()=>{
        ws.close()
        setConnected(null)
    }
},useEffect)
const usePong = extractedUse(theConnected=>{
    theConnected && theConnected.ws && theConnected.ws.send("")
},useEffect)
const useConnected = (url, cb)=>{
    const [theConnected,setConnected] = useState(null)
    const needConnected = !theConnected ? true :
        now() < theConnected.at + 5000
    useConnectedInner(setConnected, url, needConnected && cb)
    usePong(theConnected)
}

const useEverySec = extractedUse((period,set)=>{
    const will = now()
    set(was => will < was + period ? was : will)
},useCallback)
const useRecentlySeen = element => {
    const [theLastSeenAt,setLastSeenAt] = useState(0)
    const updateLastSeenAt = useEverySec(3000,setLastSeenAt)
    useAnimationFrame(element,updateLastSeenAt)
    return now() < theLastSeenAt + 6000
}

export function CamView({url}){
    const [theElement,setElement] = useState(null)
    const recentlySeen = useRecentlySeen(theElement)
    const onData = useCallback(data=>{
        //console.log(data)
        //console.log(btoa(data))
        if(theElement) theElement.src = URL.createObjectURL(data)
        //"data:image/jpeg;base64," + btoa(data)
    }, [theElement])
    useConnected(url, recentlySeen && onData)
    console.log("render")
    return createElement("img",{ref:setElement})
}

export const components = {CamView}