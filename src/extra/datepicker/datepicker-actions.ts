import {DateSettings, incrementDate, parseStringToDate, getDate, getCalendarDate} from "./date-utils";
import {getOrElse, mapOption, None, nonEmpty, Option} from "../../main/option";
import React, {ChangeEvent, KeyboardEvent} from "react";
import { ARROW_DOWN_KEY, ARROW_UP_KEY, ENTER_KEY, ESCAPE_KEY } from "../../main/keyboard-keys";
import {
    createInputState,
    createTimestampState,
    DatePickerState,
    InputState,
    isInputState,
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
                const target = e.currentTarget;
                setTimeout(() => target.blur(), 0);
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
    setState: (state: DatePickerState) => void,
    inputBoxRef: React.MutableRefObject<HTMLDivElement | null>) {
    return (e: React.FocusEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const popupDate = (inputBoxRef.current && inputBoxRef.current.contains(e.relatedTarget as Node | null))
            ? undefined : None;
        if (isInputState(currentState)) {
            if (currentState.tempTimestamp) return setState(createTimestampState(currentState.tempTimestamp, popupDate));
            memoInputValue.current = currentState.inputValue;
        }
        setState({...currentState, popupDate });        
    }
}

function getOnInputBoxBlur(currentState: DatePickerState, setFinalState: (state: DatePickerState) => void) {
    return (e: React.FocusEvent<HTMLDivElement>) => {
        if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
        setFinalState({...currentState, popupDate: None });
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

export { onTimestampChangeAction, getOnKeyDown, getOnChange, getOnBlur, getOnInputBoxBlur, getOnPopupToggle };