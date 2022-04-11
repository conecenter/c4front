import {DateSettings, incrementDate, parseStringToDate, getDate, getPopupDate} from "./date-utils";
import {getOrElse, mapOption, None, nonEmpty, Option} from "../../main/option";
import React, {ChangeEvent, KeyboardEvent} from "react";
import { ARROW_DOWN_KEY, ARROW_UP_KEY, ENTER_KEY, ESCAPE_KEY } from "../../main/keyboard-keys";
import {
    createInputChange,
    createPopupChange,
    createTimestampChange,
    DatepickerChange,
    DatePickerState,
    isTimestampState,
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

const onTimestampChangeAction = (
    currentState: DatePickerState, 
    dateSettings: DateSettings, 
    sendChange: (ch: DatepickerChange) => void
    ) => (timestamp: number): void => {
    sendChange(createTimestampChange(timestamp))
    if (currentState.popupDate) {
        const newPopupDate = mapOption(getDate(timestamp, dateSettings), getPopupDate);
        if (nonEmpty(newPopupDate)) sendChange(createPopupChange(newPopupDate));
    }
};

function getOnKeyDown(
    currentDateOpt: Option<Date>,
    dateFormat: Option<string>,
    dateSettings: DateSettings,
    memoInputValue: React.MutableRefObject<string>,
    onTimestampChange: (timestamp: number) => void,
    setSelection: (from: number, to: number) => void,
    sendFinalChange: (ch: DatepickerChange) => void
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
                sendFinalChange(
                    getOrElse(
                        mapOption(
                            parseStringToDate(inputVal, dateSettings),
                            timestamp => createTimestampChange(timestamp)
                        ),
                        createInputChange(inputVal)
                    )
                );
                const target = e.currentTarget;
                setTimeout(() => target.blur(), 0);
        }
    }
}

function getOnChange(dateSettings: DateSettings, sendChange: (ch: DatepickerChange) => void): (event: ChangeEvent<HTMLInputElement>) => void {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        sendChange(
            getOrElse(
                mapOption(
                    parseStringToDate(inputValue, dateSettings),
                    timestamp => createInputChange(inputValue, timestamp)
                ),
                createInputChange(inputValue)
            )
        );
    };
};

function getOnBlur(
    currentState: DatePickerState, 
    memoInputValue: React.MutableRefObject<string>, 
    sendFinalChange: (ch: DatepickerChange) => void,
    inputBoxRef: React.MutableRefObject<HTMLDivElement | null>,
    dateSettings: DateSettings) {
    return (e: React.FocusEvent<HTMLDivElement>) => {
        if (isTimestampState(currentState)) return;
        const { tempTimestamp, popupDate, inputValue } = currentState;
        if (tempTimestamp) {
            sendFinalChange(createTimestampChange(tempTimestamp));
            if ((inputBoxRef.current && inputBoxRef.current.contains(e.relatedTarget as Node | null)) && popupDate) {
                const newPopupDate = mapOption(getDate(tempTimestamp, dateSettings), getPopupDate);
                if (nonEmpty(newPopupDate)) sendFinalChange(createPopupChange(newPopupDate));
            }
        } else memoInputValue.current = inputValue;
    }
}

function getOnInputBoxBlur(currentState: DatePickerState, sendFinalChange: (change: DatepickerChange) => void) {
    return (e: React.FocusEvent<HTMLDivElement>) => {
        if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget) || !currentState.popupDate) return;
        sendFinalChange(createPopupChange(null));
    }
}

function getOnPopupToggle(
    currentDateOpt: Option<Date>, 
    currentState: DatePickerState,
    dateSettings: DateSettings, 
    sendFinalChange: (ch: DatepickerChange) => void) {
    return () => {
        const dateToShow = currentState.popupDate 
            ? None : getOrElse(currentDateOpt, getDate(Date.now(), dateSettings));
        const popupDate = getOrElse(mapOption(dateToShow, getPopupDate), null);
        sendFinalChange(createPopupChange(popupDate));
    }
}

export { onTimestampChangeAction, getOnKeyDown, getOnChange, getOnBlur, getOnInputBoxBlur, getOnPopupToggle };