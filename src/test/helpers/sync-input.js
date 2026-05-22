import { useState, useCallback } from 'react';
import { useSync } from "../../main/vdom-hooks";

// copy of proto sync code
const eventToPatch = (e) => ({headers: e.target.headers, value: e.target.value, skipByPath: true, retry: true})

export function useSyncInput(identity,incomingValue,deferSend){
    const [patches,enqueuePatch] = useSync(identity)
    const [lastPatch,setLastPatch] = useState()
    const defer = deferSend(!!lastPatch)
    const onChange = useCallback(event => {
        const patch = eventToPatch(event)
        enqueuePatch({ ...patch, headers: {...patch.headers,"x-r-changing":"1"}, defer})
        setLastPatch(patch)
    },[enqueuePatch,defer])
    const onBlur = useCallback(event => {
        const replacingPatch = event && event.replaceLastPatch && eventToPatch(event)
        setLastPatch(wasLastPatch=>{
            if(wasLastPatch) enqueuePatch(replacingPatch || wasLastPatch)
            return undefined
        })
    },[enqueuePatch])
    const patch = patches.slice(-1).map(({value})=>({value}))[0]
    const value = patch ? patch.value : incomingValue
    const changing = patch ? "1" : undefined // patch || lastPatch
    return ({value,changing,onChange,onBlur})
}