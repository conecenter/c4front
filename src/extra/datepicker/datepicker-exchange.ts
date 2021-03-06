import {useSync} from "../../main/vdom-hooks";
import {useCallback} from "react";
import {identityAt} from "../../main/vdom-util";
import {DatePickerServerState} from "./datepicker";

type DatePickerState = TimestampState | InputState

interface TimestampState {
    tp: 'timestamp-state'
    timestamp: number
}

const isTimestampStateType = (tp: string): tp is 'timestamp-state' => tp === 'timestamp-state'
const isTimestampState = (mode: DatePickerState): mode is TimestampState => isTimestampStateType(mode.tp)
const createTimestampState = (timestamp: number): TimestampState => ({tp: 'timestamp-state', timestamp: timestamp})

interface InputState {
    tp: 'input-state'
    inputValue: string
    tempTimestamp?: number
}

const isInputStateType = (tp: string): tp is 'input-state' => tp === 'input-state'
const isInputState = (mode: DatePickerState): mode is InputState => isInputStateType(mode.tp)
const createInputState = (inputValue: string, tempTimestamp?: number): InputState => ({
    tp: 'input-state',
    inputValue: inputValue,
    tempTimestamp: tempTimestamp
})

function serverStateToState(serverState: DatePickerServerState): DatePickerState {
    if (serverState.tp === 'timestamp-state')
        return createTimestampState(parseInt(serverState.timestamp))
    else return createInputState(serverState.inputValue, serverState.tempTimestamp !== undefined ? parseInt(serverState.tempTimestamp) : undefined)
}

function stateToPatch(mode: DatePickerState, changing: boolean, deferredSend: boolean): Patch {
    const changingHeaders = changing ? {'x-r-changing': "1"} : {}
    const extraHeaders = isInputState(mode) && mode.tempTimestamp ? {'x-r-temp-timestamp': String(mode.tempTimestamp)} : {}
    return {
        headers: {
            ...changingHeaders,
            ...extraHeaders,
            "x-r-type": mode.tp
        },
        value: isTimestampState(mode) ? String(mode.timestamp) : mode.inputValue,
        skipByPath: true, retry: true, defer: deferredSend
    }
}

function patchToState(patch: Patch): DatePickerState {
    const mode = patch.headers["x-r-type"]
    const tempTimestamp = patch.headers['x-r-temp-timestamp'] ? parseInt(patch.headers['x-r-temp-timestamp']) : undefined
    if (isTimestampStateType(mode))
        return {
            tp: "timestamp-state",
            timestamp: parseInt(patch.value)
        }
    else if (isInputStateType(mode)) return {
        tp: "input-state",
        inputValue: patch.value,
        tempTimestamp: tempTimestamp
    }
    else throw new Error("Unsupported mode")
}

interface PatchHeaders {
    'x-r-changing'?: string
    'x-r-type': string
    'x-r-temp-timestamp'?: string
}

interface Patch {
    headers: PatchHeaders
    value: string,
    skipByPath: boolean
    retry: boolean
    defer: boolean
}

interface DatePickerSyncState {
    currentState: DatePickerState
    setTempState: (state: DatePickerState) => void
    setFinalState: (state: DatePickerState) => void
}

const receiverIdOf = identityAt('receiver')

function useDatePickerStateSync(
    identity: Object,
    state: DatePickerServerState,
    deferredSend: boolean
): DatePickerSyncState {
    const [patches, enqueuePatch] = <[Patch[], (patch: Patch) => void]>useSync(receiverIdOf(identity))
    const patch: Patch = patches.slice(-1)[0]
    const currentState: DatePickerState = patch ? patchToState(patch) : serverStateToState(state)
    const onChange = useCallback((state: DatePickerState) => enqueuePatch(stateToPatch(state, true, deferredSend)), [enqueuePatch])
    const onBlur = useCallback((state: DatePickerState) => enqueuePatch(stateToPatch(state, false, false)), [enqueuePatch])
    return {currentState: currentState, setTempState: onChange, setFinalState: onBlur}
}

export {useDatePickerStateSync, isInputState, isTimestampState, createTimestampState, createInputState};
export type {DatePickerState};
