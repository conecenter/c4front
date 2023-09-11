import { DatePickerServerState } from "./datepicker";
import { Patch, PatchHeaders } from '../exchange/patch-sync';

type DatePickerState = (TimestampState | InputState) & PopupState

interface PopupState { 
    popupDate: PopupDate | null
}

interface PopupDate { year: number; month: number }

interface TimestampState {
    tp: 'timestamp-state',
    timestamp: number
}

const isTimestampStateType = (tp: string): tp is 'timestamp-state' => tp === 'timestamp-state'
const isTimestampState = (mode: TimestampState | InputState): mode is TimestampState => isTimestampStateType(mode.tp)
const createTimestampState = (timestamp: number): TimestampState => ({ tp: 'timestamp-state', timestamp });
const createTimestampChange = (timestamp: number): DateChange => {
    return { tp: 'dateChange', dpState: { tp: 'timestamp-state', timestamp } };
};

interface InputState {
    tp: 'input-state',
    inputValue: string,
    tempTimestamp?: number
}

const isInputStateType = (tp: string): tp is 'input-state' => tp === 'input-state'
const isInputState = (mode: TimestampState | InputState): mode is InputState => isInputStateType(mode.tp)
const createInputState = (inputValue: string, tempTimestamp?: number): InputState => {
    return { tp: 'input-state', inputValue, tempTimestamp };
}
const createInputChange = (inputValue: string, tempTimestamp?: number): DateChange => {
    return {
        tp: 'dateChange',
        dpState: { tp: 'input-state', inputValue, tempTimestamp }
    };
};

type DatepickerChange = DateChange | PopupChange | NoAction;

interface DateChange {
    tp: 'dateChange',
    dpState: TimestampState | InputState
}

interface PopupChange {
    tp: 'popupChange',
    popupDate: PopupDate | null
}

interface NoAction {
    tp: "noop"
}

function createPopupChange(popupDate: PopupDate | null): DatepickerChange {
    return { tp: 'popupChange', popupDate }
}

function serverStateToState(serverState: DatePickerServerState): DatePickerState {
    const popupDate: PopupDate | null = serverState.popupDate ? JSON.parse(serverState.popupDate) : null;
    const dateState = serverState.tp === 'timestamp-state' 
        ? createTimestampState(parseInt(serverState.timestamp))
        : createInputState(serverState.inputValue, serverState.tempTimestamp ? parseInt(serverState.tempTimestamp) : undefined);
    return { popupDate, ...dateState };
}

function changeToPatch(ch: DatepickerChange): Patch {
    return {
        value: ch.tp,
        headers: getHeaders(ch)
    };
}

function getHeaders(ch: DatepickerChange): PatchHeaders {
    switch (ch.tp) {
        case "dateChange":
            const headers: PatchHeaders = isInputState(ch.dpState) 
                ? { 
                    "x-r-input-value": `'${ch.dpState.inputValue}'`,
                    ...ch.dpState.tempTimestamp ? {'x-r-temp-timestamp':  String(ch.dpState.tempTimestamp)} : {}
                }
                : { 'x-r-timestamp': String(ch.dpState.timestamp) };
            return { 
                "x-r-type": ch.dpState.tp,
                ...headers
            };
        case "popupChange":
            return { "x-r-popup": ch.popupDate ? JSON.stringify(ch.popupDate) : '' };
        default:
            return {};
    }
}

function patchToChange(patch: Patch): DatepickerChange {
    const headers = patch.headers as PatchHeaders;
    switch (patch.value) {
        case 'dateChange':
            const tpState = headers["x-r-type"];
            const tempTimestamp = headers['x-r-temp-timestamp'] ? parseInt(headers['x-r-temp-timestamp']) : undefined;
            return {
                tp: 'dateChange',
                dpState: isTimestampStateType(tpState) 
                    ? createTimestampState(parseInt(headers['x-r-timestamp']))
                    : createInputState(headers["x-r-input-value"].slice(1,-1), tempTimestamp)
            };
        case 'popupChange':
            return {
                tp: 'popupChange',
                popupDate: headers['x-r-popup'] ? JSON.parse(headers['x-r-popup']) : null
            };
        default:
            return { tp: 'noop' };
    }
}

function applyChange(prevState: DatePickerState, ch: DatepickerChange): DatePickerState {
    switch (ch.tp) {
        case "dateChange":
            return { popupDate: prevState.popupDate, ...ch.dpState };
        case "popupChange":
            return { ...prevState, popupDate: ch.popupDate };
        default:
            return prevState;
    }
}

export { 
    isInputState,
    isTimestampState, 
    createTimestampChange, 
    createInputChange, 
    serverStateToState, 
    changeToPatch, 
    patchToChange, 
    applyChange, 
    createPopupChange 
};
export type { DatePickerState, PopupDate, TimestampState, InputState, DatepickerChange }