import {DateSettings, incrementDate} from "./date-utils";
import {createInputState, createTimestampState, DatePickerState} from "./datepicker-exchange";
import {nonEmpty, Option} from "../../main/option";
import React, {ChangeEvent, KeyboardEvent} from "react";
import {DOWN_ARROW_KEY, UP_ARROW_KEY} from "../../main/keys";

function updateAndSendDate(
    currentDate: Date,
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
    } = incrementDate(currentDate, dateSettings, cursorPosition, up, cycleThroughout)
    focusChange(startPosition, endPosition)
    onTimestampChange(timestamp)
}

export const onTimestampChangeAction = (setState: (state: DatePickerState) => void) => (timestamp: number): void => {
    setState(createTimestampState(timestamp))
};

export function getOnKeyDown(
    currentDateOpt: Option<Date>,
    dateSettings: DateSettings,
    onTimestampChange: (timestamp: number) => void,
    setSelection: (from: number, to: number) => void): (event: KeyboardEvent<HTMLInputElement>) => void {
    return (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (nonEmpty(currentDateOpt)) {
            const cycleThroughout = !event.ctrlKey
            const target = <HTMLInputElement>event.target
            const selectionStart = target.selectionStart ? target.selectionStart : 0
            switch (event.code) {
                case UP_ARROW_KEY.code:
                    updateAndSendDate(currentDateOpt, dateSettings, selectionStart, true, cycleThroughout, onTimestampChange, setSelection)
                    event.preventDefault()
                    break
                case DOWN_ARROW_KEY.code:
                    updateAndSendDate(currentDateOpt, dateSettings, selectionStart, false, cycleThroughout, onTimestampChange, setSelection)
                    event.preventDefault()
                    break
            }
        }
    }
}

export function getOnChange(setState: (state: DatePickerState) => void): (event: ChangeEvent<HTMLInputElement>) => void {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
        setState(createInputState(event.target.value))
    }
}
