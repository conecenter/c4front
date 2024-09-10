import {DateSettings, incrementDate, parseStringToDate, getDate, getPopupDate} from "./date-utils";
import {getOrElse, mapOption, nonEmpty, Option} from "../../main/option";
import React, {ChangeEvent, KeyboardEvent} from "react";
import { ARROW_DOWN_KEY, ARROW_UP_KEY, ENTER_KEY, ESCAPE_KEY } from "../../main/keyboard-keys";
import { CALENDAR_CLASSNAME } from "./datepicker-calendar";
import {
    createInputChange,
    createPopupChange,
    createTimestampChange,
    DatepickerChange,
    DatePickerState,
    InputState,
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
    sendTempChange: (ch: DatepickerChange) => void,
    inputBoxRef: React.MutableRefObject<HTMLElement | null>,
    togglePopup: () => void
    ): (event: KeyboardEvent<HTMLInputElement>) => void {
    return (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case ENTER_KEY: {
                e.stopPropagation();
                // Async "cTab" event dispatch to fix edit icon blinking
                const currTarget = e.currentTarget;
                setTimeout(() => currTarget.dispatchEvent(new CustomEvent("cTab", { bubbles: true })));
                break;
            }
            case ARROW_DOWN_KEY:
                if (e.altKey) {
                    togglePopup();
                    break;
                }
                // fall through
            case ARROW_UP_KEY:
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
            case ESCAPE_KEY: {
                const inputVal = memoInputValue.current;
                sendTempChange(
                    getOrElse(
                        mapOption(
                            parseStringToDate(inputVal, dateSettings),
                            timestamp => createTimestampChange(timestamp)
                        ),
                        createInputChange(inputVal)
                    )
                );
                const closestWrapper = inputBoxRef.current?.parentElement?.closest('.focusWrapper') as HTMLElement | null;
                setTimeout(() => closestWrapper?.focus());
            }
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
}

function getOnBlur(
    currentState: DatePickerState,
    memoInputValue: React.MutableRefObject<string>,
    sendChange: (ch: DatepickerChange) => void,
    inputBoxRef: React.MutableRefObject<HTMLDivElement | null>,
    dateSettings: DateSettings
) {
    return (e: React.FocusEvent<HTMLDivElement>) => {
        if (!inputBoxRef.current?.contains(e.relatedTarget as Node) || isTimestampState(currentState)) return;
        const { tempTimestamp, popupDate, inputValue } = currentState;
        if (tempTimestamp) {
            sendChange(createTimestampChange(tempTimestamp));
            if (popupDate && (inputBoxRef.current && inputBoxRef.current.contains(e.relatedTarget as Node | null))) {
                const newPopupDate = mapOption(getDate(tempTimestamp, dateSettings), getPopupDate);
                if (nonEmpty(newPopupDate)) sendChange(createPopupChange(newPopupDate));
            }
        } else memoInputValue.current = inputValue;
    }
}

function getOnInputBoxBlur(
    currentState: DatePickerState,
    memoInputValue: React.MutableRefObject<string>,
    sendFinalChange: (change: DatepickerChange) => void
) {
    const isCalendarPopupChild = (elem: EventTarget | null) => !!(elem instanceof Element && elem.closest(`.${CALENDAR_CLASSNAME}`));
    return (e: React.FocusEvent<HTMLDivElement>) => {
        if (e.currentTarget.contains(e.relatedTarget as Node) || isCalendarPopupChild(e.relatedTarget)) return;
        const timestamp = isTimestampState(currentState) ? currentState.timestamp : currentState.tempTimestamp;
        if (timestamp) return sendFinalChange(createTimestampChange(timestamp));
        const {inputValue} = currentState as InputState;
        sendFinalChange(createInputChange(inputValue));
        memoInputValue.current = inputValue;
    }
}

export { onTimestampChangeAction, getOnKeyDown, getOnChange, getOnBlur, getOnInputBoxBlur };