import React, { useRef, useState, useLayoutEffect } from "react";
import { InputElement } from "../input-element";
import { usePatchSync, Patch } from "../exchange/patch-sync";
import { patchSyncTransformers } from "./number-formatting-input-exchange";
import { useUserLocale } from "../locale";
import { escapeRegex } from "../utils";
import { usePath } from "../../main/vdom-hooks";
import { identityAt } from "../../main/vdom-util";
import { InputNumberServerState, NumberFormattingInputProps, NumberNumberServerState } from "types/c4gen.LocaleTagsApi";

const receiverIdOf = identityAt('receiver');

// scale - round decimal part to this many numbers RoundingMode.HALF_UP
// minFraction - min this many symbols after decimal separator

function NumberFormattingInput(
    {identity, state, showThousandSeparator, scale, minFraction, placeholder, children}: NumberFormattingInputProps
) {
    const { thousandSeparator, decimalSeparator } = useUserLocale().numberFormat;
    const path = usePath(identity);

    const { currentState, sendTempChange, sendFinalChange, wasChanged } = usePatchSync(
        receiverIdOf(identity), state, false, patchSyncTransformers
    );

    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const correctedCaretPos = useRef<number | null>(null);

    const onChange = (ch: { target: Patch }) => sendTempChange(createInputStateChange(ch.target.value, decimalSeparator));

    const onBlur = () => {
        if (wasChanged && isInputState(currentState)) sendFinalChange(createFinalChange(currentState));
        setIsFocused(false);
    }

    const onFocus = () => {
        setTimeout(() => {
            correctedCaretPos.current = calcCorrectedCaretPosition(inputRef.current!, thousandSeparator);
            setIsFocused(true);
        });
    }

    useLayoutEffect(
        function correctCaretPosition() {
            if (isFocused) {
                const newCaretPos = correctedCaretPos.current;
                if (newCaretPos) inputRef.current?.setSelectionRange(newCaretPos, newCaretPos);
            }
        },
        [isFocused]
    );

    function formatNumber(number: string): string {
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

function isInputState(state: InputNumberServerState | NumberNumberServerState): state is InputNumberServerState {
    return (state as InputNumberServerState).inputValue !== undefined;
}

function createInputStateChange(inputValue: string, decimalSeparator: string): InputNumberServerState {
    return { tp: 'input-state', inputValue, tempNumber: parseInputValue(inputValue, decimalSeparator)?.toString() };
}

function createFinalChange(state: InputNumberServerState) {
    const { inputValue, tempNumber } = state;
    return tempNumber !== undefined
        ? { tp: 'number-state' as const, number: tempNumber } : { tp: 'input-state' as const, inputValue };
}

function parseInputValue(value: string, decimalSeparator: string) {
    const escapedSeparator = escapeRegex(decimalSeparator);
    const regex = new RegExp(`(^\\s*-)|\\d|(?<!(${escapedSeparator}.*))${escapedSeparator}`, 'g');
    const parsedString = value.match(regex)?.join('').replace(`${decimalSeparator}`, '.');
    return parsedString ? Number(parsedString) : undefined;
}

function roundToScale(num: string, scale: number) {
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

export { NumberFormattingInput, parseInputValue };