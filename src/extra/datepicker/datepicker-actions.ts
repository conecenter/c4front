import {DateSettings, incrementDate, parseStringToDate, getDate, getCalendarDate} from "./date-utils";
import {getOrElse, mapOption, None, nonEmpty, Option} from "../../main/option";
import React, {ChangeEvent, KeyboardEvent} from "react";
import { ARROW_DOWN_KEY, ARROW_UP_KEY, ENTER_KEY, ESCAPE_KEY } from "../../main/keyboard-keys";
import {
    createInputState,
    createTimestampState,
    DatePickerState,
    InputState,
    isTimestampState,
    TimestampState
} from "./datepicker-exchange";

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
    memoInputValue: React.MutableRefObject<string>,
    onTimestampChange: (timestamp: number) => void,
    setSelection: (from: number, to: number) => void,
    setFinalState: (state: DatePickerState) => void
    ): (event: KeyboardEvent<HTMLInputElement>) => void {
    return (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case ENTER_KEY:
                e.stopPropagation();
                e.currentTarget.dispatchEvent(new CustomEvent("cTab", { bubbles: true }));
                break;
            case ARROW_UP_KEY:
            case ARROW_DOWN_KEY:
                if (nonEmpty(currentDateOpt) && nonEmpty(dateFormat)) {
                    const cycleThroughout = !e.ctrlKey;
                    const selectionStart = e.currentTarget.selectionStart || 0;
                    const up = e.key === ARROW_UP_KEY;
                    updateAndSendDate(
                        currentDateOpt, 
                        dateFormat, 
                        dateSettings, 
                        selectionStart, 
                        up, 
                        cycleThroughout, 
                        onTimestampChange, 
                        setSelection
                    );
                    e.preventDefault();
                    e.stopPropagation();
                }
                break;
            case ESCAPE_KEY:
                const inputVal = memoInputValue.current;
                setFinalState(
                    getOrElse<TimestampState | InputState>(
                        mapOption(
                            parseStringToDate(inputVal, dateSettings),
                            timestamp => createTimestampState(timestamp)
                        ),
                        createInputState(inputVal)
                    )
                );
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

function getOnBlur(
    currentState: DatePickerState, 
    memoInputValue: React.MutableRefObject<string>, 
    setState: (state: DatePickerState) => void) {
    return () => {
        if (isTimestampState(currentState)) setState(currentState);
        else if (currentState.tempTimestamp) setState(createTimestampState(currentState.tempTimestamp));
        else {
            memoInputValue.current = currentState.inputValue;
            setState(currentState);
        }
    }
}

function getOnPopupToggle(
    currentDateOpt: Option<Date>, 
    currentState: DatePickerState,
    dateSettings: DateSettings, 
    setState: (state: DatePickerState) => void) {
    return () => {
        const dateToShow = currentState.popupDate 
            ? None : getOrElse(currentDateOpt, getDate(Date.now(), dateSettings));
        const popupDate = mapOption(dateToShow, getCalendarDate);
        setState({ ...currentState, popupDate });
    }
}

export { onTimestampChangeAction, getOnKeyDown, getOnChange, getOnBlur, getOnPopupToggle };