import React from "react";
import { InputElement } from "./input-element";
import { Patch, PatchHeaders, usePatchSync } from "./exchange/patch-sync";

interface NumberFormattingInput {
    key?: string,
    identity: Object,
    state: NumberFormattingInputState,
    //showThousandSeparator: boolean,
    //scale: number,    // round decimal part to this many numbers RoundingMode.HALF_UP
    //minFraction: number,    // always this many symbols after decimal separator
}

type NumberFormattingInputState = InputState | NumberState;

interface InputState {
    inputValue: string,
    tempNumber: number
}

interface NumberState {
    number: number | ''
}

function createInputStateChange(inputValue: string): InputStateChange {
    return { tp: 'inputState', inputValue, tempNumber: 1 };
}

function isInputState(state: InputState | NumberState): state is InputState {
    return (state as InputState).inputValue !== undefined;
}

function NumberFormattingInput({identity, state}: NumberFormattingInput) {
    const { currentState, sendTempChange, sendFinalChange } = usePatchSync(
        identity, 'receiver', state, false, s => s, changeToPatch, patchToChange, (prev, ch) => ch
    );

    const onChange = (ch: { target: Patch }) => sendTempChange(createInputStateChange(ch.target.value));
    const onBlur = () => {
        if (isInputState(currentState)) sendFinalChange({ tp: 'numberState', number: currentState.tempNumber });
    }

    return (
        <InputElement
            value={isInputState(currentState) ? currentState.inputValue : currentState.number}
            onChange={onChange}
            onBlur={onBlur}
        />
    );
}

// Server exchange
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

export { NumberFormattingInput };