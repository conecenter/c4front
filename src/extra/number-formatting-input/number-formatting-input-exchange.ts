import { Patch } from "../exchange/patch-sync";
import type { InputState, NumberFormattingInputState, NumberState } from "./number-formatting-input";

type StateChange = InputStateChange | NumberStateChange;

interface InputStateChange extends InputState {
    tp: 'inputState'
}

interface NumberStateChange extends NumberState {
    tp: 'numberState'
}

const serverToState = (s: NumberFormattingInputState) => s

function changeToPatch(ch: StateChange): Patch {
    const getTpHeader = (tp: 'inputState' | 'numberState') => ({ 'x-r-change-tp': tp });
    switch (ch.tp) {
        case 'inputState':
            return {
                value: ch.inputValue,
                headers: {
                    ...getTpHeader(ch.tp),
                    ...ch.tempNumber !== undefined && { 'x-r-temp-number': String(ch.tempNumber) }
                }
            };
        case 'numberState':
            return {
                value: '',
                headers: {
                    ...getTpHeader(ch.tp),
                    'x-r-number': String(ch.number)
                }
            };
    }
}

function patchToChange({ value, headers }: Patch): StateChange {
    const tp = headers!['x-r-change-tp'] as 'inputState' | 'numberState';
    switch (tp) {
        case 'inputState': {
            const tempNumber = headers!['x-r-temp-number'];
            return {
                tp,
                inputValue: value,
                ...tempNumber !== undefined && { tempNumber: +tempNumber }
            }
        }
        case 'numberState':
            return {
                tp,
                number: +headers!['x-r-number'] };
    }
}

const applyChange = (_prev: NumberFormattingInputState, ch: StateChange) => ch;

const patchSyncTransformers = { serverToState, changeToPatch, patchToChange, applyChange };

export type { InputStateChange };
export { patchSyncTransformers };