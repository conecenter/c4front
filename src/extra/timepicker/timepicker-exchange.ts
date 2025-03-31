import { Patch, PatchHeaders } from "../exchange/patch-sync";
import { isInputState } from "./time-utils";
import { TimePickerState, InputState, TimestampState } from "./timepicker";
import type { PatchSyncTransformers } from "../exchange/patch-sync";

function getHeaders(ch: TimePickerState): PatchHeaders {
    const headers: PatchHeaders = isInputState(ch)
        ? { ...ch.tempTimestamp && {'x-r-temp-timestamp':  String(ch.tempTimestamp)} } 
        : { 'x-r-timestamp': String(ch.timestamp) };
    return {
        "x-r-change-type": "dateChange",  // compatibility with datePicker receiver
        "x-r-type": ch.tp,
        ...headers
    };
}

function changeToPatch(ch: TimePickerState): Patch {
    return {
        value: isInputState(ch) ? ch.inputValue : '',
        headers: getHeaders(ch)
    };
}

const createInputState = (inputValue: string, tempTimestampString?: string): InputState => ({
    tp: 'input-state',
    inputValue,
    ...tempTimestampString && { tempTimestamp: parseInt(tempTimestampString) }
});

const createTimestampState = (timestampString: string): TimestampState => ({
    tp: 'timestamp-state',
    timestamp: parseInt(timestampString)
});

function patchToChange(patch: Patch): TimePickerState {
    const {
        'x-r-type': tp, 
        'x-r-temp-timestamp': tempTimestampString, 
        'x-r-timestamp': timestampString 
    } = patch.headers as PatchHeaders;
    return tp === 'input-state'
        ? createInputState(patch.value, tempTimestampString)
        : createTimestampState(timestampString)
}

const patchSyncTransformers: PatchSyncTransformers<TimePickerState, TimePickerState, TimePickerState> = {
    serverToState: (s: TimePickerState) => s,
    changeToPatch,
    patchToChange,
    applyChange: (_prev: TimePickerState, ch: TimePickerState) => ch
}

export { patchSyncTransformers }