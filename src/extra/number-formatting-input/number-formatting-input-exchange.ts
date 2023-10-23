import { Patch, PatchHeaders } from "../exchange/patch-sync";
import type { InputState, NumberState } from "./number-formatting-input";

type StateChange = InputStateChange | NumberStateChange;

interface InputStateChange extends InputState {
    tp: 'inputState'
}

interface NumberStateChange extends NumberState {
    tp: 'numberState'
}

function changeToPatch(ch: StateChange): Patch {
    const tpHeader = { 'x-r-change-tp': ch.tp };
    function makePatch(value: string, headers: PatchHeaders): Patch {
        return { value, headers: { ...tpHeader, ...headers } }
    };
    switch (ch.tp) {
        case 'inputState':
            return makePatch(ch.inputValue, { 'x-r-temp-number': String(ch.tempNumber) });
        case 'numberState':
            return makePatch('', { 'x-r-number': String(ch.number) });
    }
}

function patchToChange({ value, headers }: Patch): StateChange {
    const tp = headers!['x-r-change-tp'] as 'inputState' | 'numberState';
    switch (tp) {
        case 'inputState':
            return {
                tp,
                inputValue: value,
                tempNumber: +headers!['x-r-temp-number']
            }
        case 'numberState':
            return {
                tp,
                number: +headers!['x-r-number'] };
    }
}

export type { InputStateChange };
export { changeToPatch, patchToChange };