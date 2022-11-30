import { Patch, PatchHeaders } from "../exchange/patch-sync";
import { InputState, TimePickerState, TimestampState } from "./timepicker";


const isInputState = (state: TimestampState | InputState): state is InputState => state.tp === 'input-state';

interface TimeChange {
    tp: 'timeChange',
    state: TimePickerState
}

function changeToPatch(ch: TimeChange): Patch {
    return {
        value: ch.tp,
        headers: getHeaders(ch)
    };
}

function getHeaders(ch: TimeChange): PatchHeaders {
    switch (ch.tp) {
        case "timeChange":
            const headers: PatchHeaders = isInputState(ch.state)
                ? { 
                    "x-r-input-value": ch.state.inputValue,
                    ...ch.state.tempTimestamp && {'x-r-temp-timestamp':  String(ch.state.tempTimestamp)}
                } 
                : { 'x-r-timestamp': String(ch.state.timestamp) };
            return { 
                "x-r-type": ch.state.tp,
                ...headers
            };
    }
}

function patchToChange(patch: Patch): TimeChange {
    const headers = patch.headers as PatchHeaders;
    switch (patch.value) {
        case 'timeChange':
            const tpState = headers["x-r-type"];
            const tempTimestamp = headers['x-r-temp-timestamp'] ? parseInt(headers['x-r-temp-timestamp']) : undefined;
            return {
                tp: 'timeChange',
                state: isTimestampStateType(tpState) 
                    ? createTimestampState(parseInt(headers['x-r-timestamp']))
                    : createInputState(headers["x-r-input-value"], tempTimestamp)
            };
    }
}

export { changeToPatch }