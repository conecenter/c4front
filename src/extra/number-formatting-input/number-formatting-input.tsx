import React, { useRef, useState, useLayoutEffect, ReactNode } from "react";
import { InputElement } from "../input-element";
import { usePatchSync, Patch } from "../exchange/patch-sync";
import { patchSyncTransformers, InputStateChange } from "./number-formatting-input-exchange";
import { useUserLocale } from "../locale";
import { escapeRegex } from "../utils";
import { usePath } from "../../main/vdom-hooks";
import { identityAt } from "../../main/vdom-util";

const receiverIdOf = identityAt('receiver');

interface NumberFormattingInput {
    key?: string,
    identity: object,
    state: NumberFormattingInputState,
    showThousandSeparator: boolean,
    scale: number,    // round decimal part to this many numbers RoundingMode.HALF_UP
    minFraction: number,    // min this many symbols after decimal separator
    placeholder?: string,
    children?: ReactNode
}

type NumberFormattingInputState = InputState | NumberState;

interface InputState {
    inputValue: string,
    tempNumber?: number
}

interface NumberState {
    number: number
}

function NumberFormattingInput(
    {identity, state, showThousandSeparator, scale, minFraction, placeholder, children}: NumberFormattingInput
) {
    const { thousandSeparator, decimalSeparator } = useUserLocale().numberFormat;
    const path = usePath(identity);

    const { currentState, sendTempChange, sendFinalChange, wasChanged } = usePatchSync(
        receiverIdOf(identity), state, false, patchSyncTransformers
    );

    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<{ inp: HTMLInputElement } | null>(null);
    const correctedCaretPos = useRef<number | null>(null);

    const onChange = (ch: { target: Patch }) => sendTempChange(createInputStateChange(ch.target.value, decimalSeparator));

    const onBlur = () => {
        if (wasChanged && isInputState(currentState)) sendFinalChange(createFinalChange(currentState));
        setIsFocused(false);
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
        if (number === '') return '';
        const roundedNumber = roundToScale(number, scale);
        const [wholePart, decimalPart] = roundedNumber.toString().split('.');
        const formattedWholePart = showThousandSeparator ? formatWholePart(wholePart, thousandSeparator) : wholePart;
        const formattedDecimalPart = formatDecimalPart(decimalPart, decimalSeparator, minFraction);
        return `${formattedWholePart}${formattedDecimalPart}`;
    }

    return (
        <InputElement
            _ref={inputRef}
            path={path}
            value={isInputState(currentState) ? currentState.inputValue
                : isFocused ? currentState.number.toString() : formatNumber(currentState.number)}
            inputRegex={`[0-9 ${thousandSeparator}${decimalSeparator}-]`}
            skipInvalidSymbols={true}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder} >
            {children && [
                <div key="sideContent" className="sideContent">{children}</div>
            ]}
        </InputElement>
    );
}

function isInputState(state: InputState | NumberState): state is InputState {
    return (state as InputState).inputValue !== undefined;
}

function createInputStateChange(inputValue: string, decimalSeparator: string): InputStateChange {
    return { tp: 'inputState', inputValue, tempNumber: parseInputValue(inputValue, decimalSeparator) };
}

function createFinalChange(state: InputState) {
    const { inputValue, tempNumber } = state;
    return tempNumber !== undefined
        ? { tp: 'numberState' as const, number: tempNumber } : { tp: 'inputState' as const, inputValue };
}

function parseInputValue(value: string, decimalSeparator: string): number | undefined {
    const escapedSeparator = escapeRegex(decimalSeparator);
    const regex = new RegExp(`(^\\s*-)|\\d|(?<!(${escapedSeparator}.*))${escapedSeparator}`, 'g');
    const parsedString = value.match(regex)?.join('').replace(`${decimalSeparator}`, '.');
    return parsedString ? Number(parsedString) : undefined;
}

function roundToScale(num: number, scale: number) {
    return Number(Math.round(+`${num}e${scale}`) + `e-${scale}`);
}

function formatWholePart(x: number | string, separator: string) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function formatDecimalPart(x: string | undefined, separator: string, minFraction: number) {
    const paddedString = (x || '').padEnd(minFraction, '0');
    return paddedString && `${separator}${paddedString}`;
}

function calcCorrectedCaretPosition(input: HTMLInputElement, separator: string) {
    const caretPos = input.selectionStart;
    if (!caretPos) return null;
    const separatorRegExp = new RegExp(escapeRegex(separator), 'g');
    const separatorsBeforeCaret = input.value
        .slice(0, caretPos)
        .match(separatorRegExp)?.length;
    return separatorsBeforeCaret ? caretPos - separatorsBeforeCaret : caretPos;
}

export type { NumberFormattingInputState, InputState, NumberState };
export { NumberFormattingInput, parseInputValue };