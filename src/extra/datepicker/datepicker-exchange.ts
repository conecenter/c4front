import {useSync} from "../../main/vdom-hooks";
import {useCallback} from "react";

type DatePickerState = TimestampState | InputState

interface TimestampState {
    type: 'timestamp-state';
    timestamp: number;
}

const isTimestampStateType = (type: string): type is 'timestamp-state' => type === 'timestamp-state'
const isTimestampState = (mode: DatePickerState): mode is TimestampState => isTimestampStateType(mode.type)
const createTimestampState = (timestamp: number): TimestampState => ({type: 'timestamp-state', timestamp: timestamp})

interface InputState {
    type: 'input-state';
    inputValue: string;
    tempTimestamp?: number;
}

const isInputStateType = (type: string): type is 'input-state' => type === 'input-state'
const isInputState = (mode: DatePickerState): mode is InputState => isInputStateType(mode.type)
const createInputState = (inputValue: string, tempTimestamp?: number): InputState => ({type: 'input-state', inputValue: inputValue, tempTimestamp: tempTimestamp})

function stateToPatch(mode: DatePickerState): Patch {
    const extraHeaders = isInputState(mode) && mode.tempTimestamp ? {'x-r-temp-timestamp': String(mode.tempTimestamp)} : {}
    return {
        headers: {
            ...extraHeaders,
            "x-r-type": mode.type
        },
        value: isTimestampState(mode) ? String(mode.timestamp) : mode.inputValue
    }
}

function patchToState(patch: Patch): DatePickerState {
    const mode = patch.headers["x-r-type"]
    const tempTimestamp = patch.headers['x-r-temp-timestamp'] ? parseInt(patch.headers['x-r-temp-timestamp']) : undefined
    if (isTimestampStateType(mode))
        return {
            type: "timestamp-state",
            timestamp: parseInt(patch.value)
        }
    else if (isInputStateType(mode)) return {
        type: "input-state",
        inputValue: patch.value,
        tempTimestamp: tempTimestamp
    }
    else throw new Error("Unsupported mode")
}

interface PatchHeaders {
    'x-r-type': string;
    'x-r-temp-timestamp'?: string;
}

interface Patch {
    headers: PatchHeaders;
    value: string;
}

interface DatePickerSyncState {
    state: DatePickerState;
    setState: (state: DatePickerState) => void;
}

function useDatePickerStateSync(
    handlerName: string,
    state: DatePickerState,
): DatePickerSyncState {
    const [patches, enqueuePatch] = <[Patch[], (patch: Patch) => void]>useSync(handlerName)
    const patch: Patch = patches.slice(-1)[0]
    const currentState: DatePickerState = patch ? patchToState(patch) : state
    const onChange = useCallback((state: DatePickerState) => enqueuePatch(stateToPatch(state)), [enqueuePatch])
    return {state: currentState, setState: onChange}
}

export {useDatePickerStateSync, isInputState, isTimestampState, createTimestampState, createInputState};
export type {DatePickerState};
