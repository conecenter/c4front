import { Patch, PatchHeaders } from "../exchange/patch-sync";
import { TimePickerState, InputState, TimestampState } from "./timepicker";

const isInputState = (state: TimestampState | InputState): state is InputState => state.tp === 'input-state';

// Change to patch
function getHeaders(ch: TimePickerState): PatchHeaders {
    const headers: PatchHeaders = isInputState(ch)
        ? { 
            "x-r-input-value": ch.inputValue,
            ...ch.tempTimestamp && {'x-r-temp-timestamp':  String(ch.tempTimestamp)}
        } 
        : { 'x-r-timestamp': String(ch.timestamp) };
    return { 
        "x-r-type": ch.tp,
        ...headers
    };
}

function changeToPatch(ch: TimePickerState): Patch {
    return {
        value: 'timeChange',
        headers: getHeaders(ch)
    };
}

// Patch to change
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
        'x-r-input-value': inputValue, 
        'x-r-temp-timestamp': tempTimestampString, 
        'x-r-timestamp': timestampString 
    } = patch.headers as PatchHeaders;
    return tp === 'input-state'
        ? createInputState(inputValue, tempTimestampString)
        : createTimestampState(timestampString)
}

export { changeToPatch, patchToChange, isInputState }