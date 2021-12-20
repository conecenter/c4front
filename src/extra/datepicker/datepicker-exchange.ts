import { useSync } from "../../main/vdom-hooks";
import { identityAt } from "../../main/vdom-util";
import { DatePickerServerState } from "./datepicker";
import { DateSettings, getDate } from "./date-utils";
import { None, nonEmpty } from "../../main/option";

type DatePickerState = TimestampState | InputState

type PopupDate = { year: number, month: number } | None ;

interface PopupState {
    popupDate?: PopupDate
}

interface TimestampState extends PopupState {
    tp: 'timestamp-state',
    timestamp: number
}

const isTimestampStateType = (tp: string): tp is 'timestamp-state' => tp === 'timestamp-state'
const isTimestampState = (mode: DatePickerState): mode is TimestampState => isTimestampStateType(mode.tp)
const createTimestampState = (timestamp: number, popupDate?: PopupDate): TimestampState => {
    return { tp: 'timestamp-state', timestamp, popupDate };
};

interface InputState extends PopupState {
    tp: 'input-state',
    inputValue: string,
    tempTimestamp?: number
}

const isInputStateType = (tp: string): tp is 'input-state' => tp === 'input-state'
const isInputState = (mode: DatePickerState): mode is InputState => isInputStateType(mode.tp)
const createInputState = (inputValue: string, tempTimestamp?: number): InputState => {
    return { tp: 'input-state', inputValue, tempTimestamp };
};

function serverStateToState(serverState: DatePickerServerState): DatePickerState {
    const popupDate = serverState.popupDate ? JSON.parse(serverState.popupDate) : undefined;
    if (serverState.tp === 'timestamp-state')
        return createTimestampState(parseInt(serverState.timestamp), popupDate);
    else return createInputState(serverState.inputValue, serverState.tempTimestamp !== undefined ? parseInt(serverState.tempTimestamp) : undefined);
}

function stateToPatch(
    mode: DatePickerState, 
    prevState: DatePickerState, 
    dateSettings: DateSettings, 
    changing: boolean, 
    deferredSend: boolean
): Patch {
    const changingHeaders = changing ? {'x-r-changing': "1"} : {};
    const extraHeaders = isInputState(mode) && mode.tempTimestamp ? {'x-r-temp-timestamp': String(mode.tempTimestamp)} : {};
    const popupHeader = setPopupHeader(mode, prevState, dateSettings);
    return {
        headers: {
            ...changingHeaders,
            ...extraHeaders,
            ...popupHeader,
            "x-r-type": mode.tp
        },
        value: isTimestampState(mode) ? String(mode.timestamp) : mode.inputValue,
        skipByPath: true, retry: true, defer: deferredSend
    }
}

function setPopupHeader(currState: DatePickerState, prevState: DatePickerState, dateSettings: DateSettings) {
    let popupDate: PopupDate | undefined;
    if (currState.popupDate) {
        popupDate = currState.popupDate;
    } 
    else if (prevState.popupDate) {
        if (isTimestampState(currState)) {
            const newDate = getDate(currState.timestamp, dateSettings);
            popupDate = nonEmpty(newDate) ? { year: newDate.getFullYear(), month: newDate.getMonth() } : None;
        } 
        else popupDate = prevState.popupDate;
    }
    return nonEmpty(popupDate) ? {'x-r-popup': JSON.stringify(popupDate)} : {};
}

function patchToState(patch: Patch): DatePickerState {
    const mode = patch.headers["x-r-type"];
    const tempTimestamp = patch.headers['x-r-temp-timestamp'] ? parseInt(patch.headers['x-r-temp-timestamp']) : undefined;
    const popupDate = patch.headers['x-r-popup'] ? JSON.parse(patch.headers['x-r-popup']) : undefined;
    if (isTimestampStateType(mode)) return {
        tp: "timestamp-state",
        timestamp: parseInt(patch.value),
        popupDate,
    }
    else if (isInputStateType(mode)) return {
        tp: "input-state",
        inputValue: patch.value,
        tempTimestamp: tempTimestamp,
        popupDate,
    }
    else throw new Error("Unsupported mode")
}

interface PatchHeaders {
    'x-r-changing'?: string,
    'x-r-type': string,
    'x-r-temp-timestamp'?: string,
    'x-r-popup'?: string,
}

interface Patch {
    headers: PatchHeaders,
    value: string,
    skipByPath: boolean,
    retry: boolean,
    defer: boolean,
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
    dateSettings: DateSettings,
    deferredSend: boolean
): DatePickerSyncState {
    const [patches, enqueuePatch] = <[Patch[], (patch: Patch) => void]>useSync(receiverIdOf(identity));
    const patch: Patch = patches.slice(-1)[0];
    const currentState: DatePickerState = patch ? patchToState(patch) : serverStateToState(state);
    const onChange = (state: DatePickerState) => enqueuePatch(stateToPatch(state, currentState, dateSettings, true, deferredSend));
    const onBlur = (state: DatePickerState) => enqueuePatch(stateToPatch(state, currentState, dateSettings, false, false));
    return {currentState: currentState, setTempState: onChange, setFinalState: onBlur};
}

export { useDatePickerStateSync, isInputState, isTimestampState, createTimestampState, createInputState };
export type { DatePickerState, PopupDate };