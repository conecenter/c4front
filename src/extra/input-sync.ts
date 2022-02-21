import {identityAt} from "../main/vdom-util";
import {useSync} from "../main/vdom-hooks";
import {useCallback} from "react";

interface PatchHeaders {
    [name: string]: string
}

interface Patch {
    headers?: PatchHeaders
    value: string
}

interface SyncState<State> {
    currentState: State,
    setTempState: (s: State) => void,
    setFinalState: (s: State) => void,
}

interface SendPatchHeaders extends PatchHeaders {}

interface SendPatch {
    headers: SendPatchHeaders
    value: string
    skipByPath: boolean
    retry: boolean
    defer: boolean
}

const receiverId = (name: string) => identityAt(name)

function stateToSendPatch(patch: Patch, changing: boolean, deferredSend: boolean): SendPatch {
    const prepHeaders: SendPatchHeaders = patch.headers ? patch.headers : {}
    const changingHeaders: SendPatchHeaders = changing ? {"x-r-changing": "1"} : {}
    const headers: SendPatchHeaders = {
        ...changingHeaders,
        ...prepHeaders,
    }
    return {
        value: patch.value,
        headers: headers,
        skipByPath: true,
        retry: true,
        defer: deferredSend
    }
}

function useInputSync<ServerState, State>(
    identity: Object,
    receiverName: string,
    serverState: ServerState,
    deferredSend: boolean,
    patchToState: (p: Patch) => State,
    serverToState: (s: ServerState) => State,
    stateToPatch: (s: State) => Patch
): SyncState<State> {
    const [patches, enqueuePatch] = <[SendPatch[], (patch: SendPatch) => void]>useSync(receiverId(receiverName)(identity))
    const patch: SendPatch = patches.slice(-1)[0]
    const currentState: State = patch ? patchToState(patch) : serverToState(serverState)
    const onChange = useCallback((state: State) => enqueuePatch(stateToSendPatch(stateToPatch(state), true, deferredSend)), [enqueuePatch])
    const onBlur = useCallback((state: State) => enqueuePatch(stateToSendPatch(stateToPatch(state), false, false)), [enqueuePatch])
    return {currentState: currentState, setTempState: onChange, setFinalState: onBlur}
}

export {useInputSync}
export type {Patch, PatchHeaders}