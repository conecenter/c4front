import {DateSettings, incrementDate, parseStringToDate} from "./date-utils";
import {createInputState, createTimestampState, DatePickerState, isTimestampState} from "./datepicker-exchange";
import {getOrElse, mapOption, nonEmpty, Option} from "../../main/option";
import React, {ChangeEvent, FocusEvent, KeyboardEvent} from "react";
import {DOWN_ARROW_KEY, UP_ARROW_KEY} from "../../main/keyborad-keys";

function updateAndSendDate(
    currentDate: Date,
    dateFormat: string,
    dateSettings: DateSettings,
    cursorPosition: number,
    up: boolean,
    cycleThroughout: boolean,
    onTimestampChange: (timestamp: number) => void,
    focusChange: (from: number, to: number) => void) {
    const {
        timestamp,
        startPosition,
        endPosition
    } = incrementDate(currentDate, dateFormat, dateSettings, cursorPosition, up, cycleThroughout)
    focusChange(startPosition, endPosition)
    onTimestampChange(timestamp)
}

export const onTimestampChangeAction = (setState: (state: DatePickerState) => void) => (timestamp: number): void => {
    setState(createTimestampState(timestamp))
};

export function getOnKeyDown(
    currentDateOpt: Option<Date>,
    dateFormat: Option<string>,
    dateSettings: DateSettings,
    onTimestampChange: (timestamp: number) => void,
    setSelection: (from: number, to: number) => void): (event: KeyboardEvent<HTMLInputElement>) => void {
    return (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (nonEmpty(currentDateOpt) && nonEmpty(dateFormat)) {
            const cycleThroughout = !event.ctrlKey
            const target = <HTMLInputElement>event.target
            const selectionStart = target.selectionStart ? target.selectionStart : 0
            switch (event.code) {
                case UP_ARROW_KEY.code:
                    updateAndSendDate(currentDateOpt, dateFormat, dateSettings, selectionStart, true, cycleThroughout, onTimestampChange, setSelection)
                    event.preventDefault()
                    break
                case DOWN_ARROW_KEY.code:
                    updateAndSendDate(currentDateOpt, dateFormat, dateSettings, selectionStart, false, cycleThroughout, onTimestampChange, setSelection)
                    event.preventDefault()
                    break
            }
        }
    }
}

export function getOnChange(dateSettings: DateSettings, setState: (state: DatePickerState) => void): (event: ChangeEvent<HTMLInputElement>) => void {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value
        setState(
            getOrElse(
                mapOption(
                    parseStringToDate(inputValue, dateSettings),
                    timestamp => createInputState(inputValue, timestamp)
                ),
                createInputState(inputValue)
            )
        )
    }
}

export function getOnBlur(currentState: DatePickerState, setState: (state: DatePickerState) => void): (event: FocusEvent<HTMLInputElement>) => void {
    return (event: FocusEvent<HTMLInputElement>) => {
        isTimestampState(currentState) ?
            setState(currentState) :
            currentState.tempTimestamp ?
                setState(createTimestampState(currentState.tempTimestamp)) :
                setState(currentState)
    }
}
