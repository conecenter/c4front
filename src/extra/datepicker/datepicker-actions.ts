import {DateSettings, incrementDate, parseStringToDate, getTimestamp, getDate} from "./date-utils";
import {createInputState, createTimestampState, DatePickerState, isTimestampState, PopupDate} from "./datepicker-exchange";
import {getOrElse, isEmpty, mapOption, nonEmpty, Option} from "../../main/option";
import React, {ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent} from "react";
import {ARROW_DOWN_KEY, ARROW_UP_KEY} from "../../main/keyboard-keys";
import {addMonths, set} from "date-fns";

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

// export const onTimestampChangeAction = (setState: (state: DatePickerState) => void) => (timestamp: number): void => {
//     const tpDate = new Date(timestamp);
//     const popupDate = { year: tpDate.getFullYear(), month: tpDate.getMonth() };
//     setState(createTimestampState(timestamp, popupDate));
// };

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

export function getOnBlur(currentState: DatePickerState, dateSettings: DateSettings, setState: (state: DatePickerState) => void): (event: FocusEvent<HTMLInputElement>) => void {
    return (event: FocusEvent<HTMLInputElement>) => {
        console.log('onBlur')
        if (isTimestampState(currentState)) setState(currentState);
        else {
            const { tempTimestamp, popupDate } = currentState;
            console.log(tempTimestamp, popupDate)
            if (tempTimestamp && popupDate) {
                 const newDate = getDate(tempTimestamp, dateSettings);
                 const newPopupDate = { year: newDate.getFullYear(), month: newDate.getMonth() };
                 setState(createTimestampState(tempTimestamp, newPopupDate));
            } 
            else if (tempTimestamp) setState(createTimestampState(tempTimestamp));
            else setState(currentState);
        }
    }
}

export function getOnPopupToggle(
    currentDateOpt: Option<Date>, 
    currentState: DatePickerState, 
    setState: (state: DatePickerState) => void) {
    return () => {
        console.log('onPopupToggle', currentState)
        const today = new Date();  // correct to server timezone
        const popupDate = currentState.popupDate 
            ? undefined 
            : nonEmpty(currentDateOpt)
                ? { year: currentDateOpt.getFullYear(), month: currentDateOpt.getMonth() }
                : { year: today.getFullYear(), month: today.getMonth() };
        setState({ ...currentState, popupDate });
    }    
}

export function getOnDateChoice(currentDateOpt: Option<Date>, dateSettings: DateSettings, setFinalState: (state: DatePickerState) => void) {
    return (e: MouseEvent) => {
        const dateString = e.target instanceof HTMLSpanElement ? e.target.dataset.date : undefined;
        if (!dateString) return;
        const dateValues = dateString.split('-');
        const isDateAvailable = nonEmpty(currentDateOpt);
        const baseDate = isDateAvailable ? currentDateOpt : getDate(Date.now(), dateSettings);
        if (isEmpty(baseDate)) return;
        const timeSettings = isDateAvailable ? {} : { hours: 0, minutes: 0, seconds: 0 };
        const chosenDate = set(baseDate, {
            year: +dateValues[2],
            month: +dateValues[1],
            date: +dateValues[0],
            ...timeSettings
        });
        setFinalState(createTimestampState(getTimestamp(chosenDate, dateSettings)));
    }
}

export function getOnMonthArrowClick(currentState: DatePickerState, setFinalState: (state: DatePickerState) => void) {
    return (e: MouseEvent) => {
        const change = e.target instanceof HTMLButtonElement ? e.target.dataset.change : undefined;
        if (change) {
            const { year, month } = currentState.popupDate!;
            const newDate = addMonths(new Date(year, month), +change);
            setFinalState({...currentState, popupDate: {year: newDate.getFullYear(), month: newDate.getMonth() }});
        }
    }
};
