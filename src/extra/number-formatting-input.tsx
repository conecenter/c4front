import React, { useRef, useState, useLayoutEffect } from "react";
import { InputElement } from "./input-element";
import { Patch, PatchHeaders, usePatchSync } from "./exchange/patch-sync";
import { useUserLocale } from "./locale";
import { escapeRegex } from "./utils";

interface NumberFormattingInput {
    key?: string,
    identity: Object,
    state: NumberFormattingInputState,
    showThousandSeparator: boolean,
    scale: number,    // round decimal part to this many numbers RoundingMode.HALF_UP
    minFraction: number,    // min this many symbols after decimal separator
}

type NumberFormattingInputState = InputState | NumberState;

interface InputState {
    inputValue: string,
    tempNumber: number | ''
}

interface NumberState {
    number: number | ''
}

function NumberFormattingInput({identity, state, showThousandSeparator, scale, minFraction}: NumberFormattingInput) {
    const { numberFormat } = useUserLocale();
    const { thousandSeparator, decimalSeparator } = numberFormat;

    const { currentState, sendTempChange, sendFinalChange } = usePatchSync(
        identity, 'receiver', state, false, s => s, changeToPatch, patchToChange, (_prev, ch) => ch
    );

    const [isFocused, setIsFocused] = useState(false);

    const inputRef = useRef<{ inp: HTMLInputElement } | null>(null);

    const correctedCaretPos = useRef<number | null>(null);

    // Event handlers
    const onChange = (ch: { target: Patch }) => sendTempChange(createInputStateChange(ch.target.value, decimalSeparator));
    const onBlur = () => {
        if (isInputState(currentState)) sendFinalChange({ tp: 'numberState', number: currentState.tempNumber });
    }
    const onFocus = () => {
        setTimeout(() => {
            correctedCaretPos.current = calcCorrectedCaretPosition(inputRef.current!.inp, thousandSeparator);
            setIsFocused(true);
        });
    }

    useLayoutEffect(
        function correctCaretPosition() {
            if (isFocused) {
                const newCaretPos = correctedCaretPos.current;
                if (newCaretPos) inputRef.current?.inp.setSelectionRange(newCaretPos, newCaretPos);
            }
        },
        [isFocused]
    );
        
    function formatNumber(number: number | ''): string {
        const [wholePart, decimalPart] = number.toString().split(/\b(?=\.)/);
        const formattedWholePart = showThousandSeparator ? formatWholePart(wholePart, thousandSeparator) : wholePart;
        const formattedDecimalPart = formatDecimalPart(decimalPart, decimalSeparator, scale, minFraction);
        return `${formattedWholePart}${formattedDecimalPart}`;
    }

    return (
        <InputElement
            _ref={inputRef}
            value={isInputState(currentState) ? currentState.inputValue
                : isFocused ? currentState.number.toString() : formatNumber(currentState.number)}
            inputRegex={`[0-9 ${thousandSeparator}${decimalSeparator}-]`}
            skipInvalidSymbols={true}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
        />
    );
}

function isInputState(state: InputState | NumberState): state is InputState {
    return (state as InputState).inputValue !== undefined;
}

function createInputStateChange(inputValue: string, decimalSeparator: string): InputStateChange {
    return { tp: 'inputState', inputValue, tempNumber: parseInputValue(inputValue, decimalSeparator) };
}

function parseInputValue(value: string, decimalSeparator: string): number | '' {
    const escapedSeparator = escapeRegex(decimalSeparator);
    const regex = new RegExp(`(^\\s*-)|\\d|(?<!(${escapedSeparator}.*))${escapedSeparator}`, 'g');
    const parsedString = value.match(regex)?.join('').replace(`${decimalSeparator}`, '.');
    return parsedString !== undefined ? Number(parsedString) : '';
}

function formatWholePart(x: number | string, separator: string) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function formatDecimalPart(x: string | undefined, separator: string, scale: number, minFraction: number) {
    if (!x) return '';
    let formattedNumber = (+x).toFixed(scale);
    if (minFraction > scale) formattedNumber = (+formattedNumber).toFixed(minFraction);
    return formattedNumber.replace('0.', separator);
}

function calcCorrectedCaretPosition(input: HTMLInputElement, separator: string) {
    const caretPos = input.selectionStart;
    if (!caretPos) return null;
    const separatorRegExp = new RegExp(separator, 'g');
    const separatorsBeforeCaret = input.value
        .slice(0, caretPos)
        .match(separatorRegExp)?.length;
    return separatorsBeforeCaret ? caretPos - separatorsBeforeCaret : null;
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

export { NumberFormattingInput, parseInputValue };