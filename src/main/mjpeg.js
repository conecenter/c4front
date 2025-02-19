
import {createElement,useState,useEffect} from "react"

const now = () => Date.now()

const manageCam = (url,theElement) => {
    let wasAt = 0
    let ws = undefined
    const close = () => {
        try { ws && ws.readyState <= ws.OPEN && ws.close() } catch(e){ console.trace(e) }
    }
    const activate = () => {
        if(document.hidden) close()
        else if(ws && ws.readyState <= ws.OPEN && now() - wasAt < 5000) ws.readyState === ws.OPEN && ws.send("")
        else {
            close()
            ws = new WebSocket(url)
            ws.addEventListener("message", ev => {
                URL.revokeObjectURL(theElement.src)
                theElement.src = URL.createObjectURL(ev.data)
                wasAt = now()
            })
            wasAt = now()
        }
    }
    const interval = setInterval(() => activate(), 1000)
    activate()
    return () => {
        clearInterval(interval)
        close()
    }
}

export function CamView({url, height}){
    const [theElement,setElement] = useState(null)
    useEffect(() => url && theElement ? manageCam(url, theElement) : undefined, [url, theElement])
    return createElement("img",{ref:setElement, style:{height:height+"px"}})
}
//"data:image/jpeg;base64," + btoa(data)
export const components = {CamView}