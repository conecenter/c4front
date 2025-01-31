import {useSync} from "../../main/vdom-hooks";
import {useCallback, useMemo, useRef} from "react";

interface PatchHeaders {
    [name: string]: string
}

interface Patch {
    headers?: PatchHeaders
    value: string
}

interface SyncState<State, StateChange> {
    currentState: State,
    sendTempChange: (change: StateChange) => void,
    sendFinalChange: (change: StateChange) => void,
    wasChanged: boolean
}

interface SendPatchHeaders extends PatchHeaders {
}

interface SendPatch {
    headers?: SendPatchHeaders
    value: string
    skipByPath?: boolean
    retry?: boolean
    defer?: boolean
}

function stateToSendPatch(patch: Patch, changing: boolean, deferredSend: boolean): SendPatch {
    const changingHeaders: SendPatchHeaders = changing ? {"x-r-changing": "1"} : {}
    const headers: SendPatchHeaders = {
        ...changingHeaders,
        ...patch.headers,
    }
    return {
        value: patch.value,
        headers: headers,
        skipByPath: changing,
        retry: true,
        defer: deferredSend
    }
}

function usePatchSync<ServerState, State, StateChange>(
    identity: object,
    serverState: ServerState,
    deferredSend: boolean,
    serverToState: (s: ServerState) => State,
    changeToPatch: (ch: StateChange) => Patch,
    patchToChange: (p: Patch) => StateChange,
    applyChange: (prevState: State, ch: StateChange) => State,
): SyncState<State, StateChange> {
    const [patches, enqueuePatch] = useSync(identity)
    const wasChanged = useRef(false);
    const convertedFromServer: State = useMemo(() => serverToState(serverState), [serverState, serverToState])
    const patchedState: State = useMemo(
        () => patches.reduce<State>((prev, patch) => applyChange(prev, patchToChange(patch)), convertedFromServer),
        [patches, applyChange, patchToChange, convertedFromServer]
    )
    const onChange = useCallback(
        (state: StateChange) => {
            enqueuePatch(stateToSendPatch(changeToPatch(state), true, deferredSend))
            wasChanged.current = true
        },
        [enqueuePatch, changeToPatch, deferredSend]
    )
    const onBlur = useCallback(
        (state: StateChange) => {
            enqueuePatch(stateToSendPatch(changeToPatch(state), false, false))
            wasChanged.current = false
        },
        [enqueuePatch, changeToPatch]
    )
    return {currentState: patchedState, sendTempChange: onChange, sendFinalChange: onBlur, wasChanged: wasChanged.current}
}

export {usePatchSync}
export type {Patch, PatchHeaders, SendPatch}
