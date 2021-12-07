import {DateSettings, incrementDate, parseStringToDate} from "./date-utils";
import {createInputState, createTimestampState, DatePickerState, isTimestampState} from "./datepicker-exchange";
import {getOrElse, mapOption, nonEmpty, Option} from "../../main/option";
import React, {ChangeEvent, FocusEvent, KeyboardEvent} from "react";
import {ARROW_DOWN_KEY, ARROW_UP_KEY} from "../../main/keyboard-keys";
import { PopupDate } from "./datepicker-exchange";

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
                case ARROW_UP_KEY.code:
                    updateAndSendDate(currentDateOpt, dateFormat, dateSettings, selectionStart, true, cycleThroughout, onTimestampChange, setSelection)
                    event.preventDefault()
                    break
                case ARROW_DOWN_KEY.code:
                    updateAndSendDate(currentDateOpt, dateFormat, dateSettings, selectionStart, false, cycleThroughout, onTimestampChange, setSelection)
                    event.preventDefault()
                    break
            }
        }
    }
}

export function getOnChange(dateSettings: DateSettings, popupDate: PopupDate, setState: (state: DatePickerState) => void): (event: ChangeEvent<HTMLInputElement>) => void {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value
        setState(
            getOrElse(
                mapOption(
                    parseStringToDate(inputValue, dateSettings),
                    timestamp => createInputState(inputValue, popupDate, timestamp)
                ),
                createInputState(inputValue, popupDate)
            )
        );
    };
};

export function getOnBlur(currentState: DatePickerState, setState: (state: DatePickerState) => void): (event: FocusEvent<HTMLInputElement>) => void {
    return (event: FocusEvent<HTMLInputElement>) => {
        if (isTimestampState(currentState)) setState(currentState);
        else {
            const { tempTimestamp, popupDate } = currentState;
            tempTimestamp
                ? setState(createTimestampState(tempTimestamp, popupDate))
                : setState(currentState);
        }
    }
}

export function togglePopup(
    currentDateOpt: Option<Date>, 
    currentState: DatePickerState, 
    setState: (state: DatePickerState) => void) {
    return () => {
        const today = new Date();
        const popupDate = currentState.popupDate 
            ? undefined 
            : nonEmpty(currentDateOpt)
                ? { year: currentDateOpt.getFullYear(), month: currentDateOpt.getMonth() }
                : { year: today.getFullYear(), month: today.getMonth() };
        setState({ ...currentState, popupDate });
    }    
}