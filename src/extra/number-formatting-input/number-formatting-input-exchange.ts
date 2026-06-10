import { NumberInputServerState } from "c4f/sapi/ee/cone/c4ui/c4gen.LocaleTagsApi";
import { Patch } from "../exchange/patch-sync";


const serverToState = (s: NumberInputServerState) => s

function changeToPatch(ch: NumberInputServerState): Patch {
    const getTpHeader = (tp: 'input-state' | 'number-state') => ({ 'x-r-change-tp': tp });
    switch (ch.tp) {
        case 'input-state':
            return {
                value: ch.inputValue,
                headers: {
                    ...getTpHeader(ch.tp),
                    ...ch.tempNumber !== undefined && { 'x-r-temp-number': String(ch.tempNumber) }
                }
            };
        case 'number-state':
            return {
                value: '',
                headers: {
                    ...getTpHeader(ch.tp),
                    'x-r-number': String(ch.number)
                }
            };
    }
}

function patchToChange({ value, headers }: Patch): NumberInputServerState {
    const tp = headers!['x-r-change-tp'] as 'input-state' | 'number-state';
    switch (tp) {
        case 'input-state': {
            const tempNumber = headers!['x-r-temp-number'];
            return {
                tp,
                inputValue: value,
                ...tempNumber !== undefined && { tempNumber }
            }
        }
        case 'number-state':
            return {
                tp,
                number: headers!['x-r-number'] };
    }
}

const applyChange = (_prev: NumberInputServerState, ch: NumberInputServerState) => ch;

const patchSyncTransformers = { serverToState, changeToPatch, patchToChange, applyChange };

export { patchSyncTransformers };