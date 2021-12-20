import {DateSettings, incrementDate, parseStringToDate, getDate} from "./date-utils";
import {createInputState, createTimestampState, DatePickerState, isTimestampState, PopupDate} from "./datepicker-exchange";
import {getOrElse, mapOption, None, nonEmpty, Option} from "../../main/option";
import React, {ChangeEvent, KeyboardEvent} from "react";
import {ARROW_DOWN_KEY, ARROW_UP_KEY, ENTER_KEY} from "../../main/keyboard-keys";

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

const onTimestampChangeAction = (setState: (state: DatePickerState) => void) => (timestamp: number): void => {
    setState(createTimestampState(timestamp))
};

function getOnKeyDown(
    currentDateOpt: Option<Date>,
    dateFormat: Option<string>,
    dateSettings: DateSettings,
    onTimestampChange: (timestamp: number) => void,
    setSelection: (from: number, to: number) => void,
    onBlur: () => void): (event: KeyboardEvent<HTMLInputElement>) => void {
    return (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.code === ENTER_KEY.code) onBlur();
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

function getOnChange(dateSettings: DateSettings, setState: (state: DatePickerState) => void): (event: ChangeEvent<HTMLInputElement>) => void {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        setState(
            getOrElse(
                mapOption(
                    parseStringToDate(inputValue, dateSettings),
                    timestamp => createInputState(inputValue, timestamp)
                ),
                createInputState(inputValue)
            )
        );
    };
};

function getOnBlur(currentState: DatePickerState, setState: (state: DatePickerState) => void) {
    return () => {
        isTimestampState(currentState)
            ? setState(currentState) 
            : currentState.tempTimestamp
                ? setState(createTimestampState(currentState.tempTimestamp))
                : setState(currentState);
    }
}

function getOnPopupToggle(
    currentDateOpt: Option<Date>, 
    currentState: DatePickerState,
    dateSettings: DateSettings, 
    setState: (state: DatePickerState) => void) {
    return () => {
        let popupDate: PopupDate;
        if (currentState.popupDate) popupDate = None;
        else if (nonEmpty(currentDateOpt)) {
            popupDate = { year: currentDateOpt.getFullYear(), month: currentDateOpt.getMonth() };
        } else {
            const today =  getDate(Date.now(), dateSettings);
            popupDate = nonEmpty(today) ? { year: today.getFullYear(), month: today.getMonth() } : None;
        }
        setState({ ...currentState, popupDate });
    }
}

export { 
    onTimestampChangeAction, 
    getOnKeyDown, 
    getOnChange, 
    getOnBlur, 
    getOnPopupToggle
};