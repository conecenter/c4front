import {DateSettings, incrementDate, parseStringToDate, getTimestamp, getDate} from "./date-utils";
import {createInputState, createTimestampState, DatePickerState, isTimestampState, PopupDate} from "./datepicker-exchange";
import {getOrElse, isEmpty, mapOption, None, nonEmpty, Option} from "../../main/option";
import React, {ChangeEvent, KeyboardEvent, MouseEvent} from "react";
import {ARROW_DOWN_KEY, ARROW_UP_KEY, ENTER_KEY} from "../../main/keyboard-keys";
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
            popupDate = nonEmpty(today) ? { year: today.getFullYear(), month: today.getMonth() } : undefined;
        }
        setState({ ...currentState, popupDate });
    }
}

function getOnDateChoice(
    currentDateOpt: Option<Date>,
    dateSettings: DateSettings,
    setFinalState: (state: DatePickerState) => void) {
    return (e: MouseEvent) => {
        if (!(e.target instanceof HTMLSpanElement && e.target.dataset.date)) return;
        const dateString = e.target.dataset.date;
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
        setFinalState(createTimestampState(getTimestamp(chosenDate, dateSettings), None));
    }
}

function getOnMonthArrowClick(currentState: DatePickerState, setFinalState: (state: DatePickerState) => void) {
    return (e: MouseEvent) => {
        const change = e.target instanceof HTMLButtonElement ? e.target.dataset.change : undefined;
        if (change && nonEmpty(currentState.popupDate)) {
            const { year, month } = currentState.popupDate!;
            const newDate = addMonths(new Date(year, month), +change);
            setFinalState({...currentState, popupDate: { year: newDate.getFullYear(), month: newDate.getMonth() }});
        }
    }
};

function getOnNowBtnClick(setFinalState: (state: DatePickerState) => void) {
    return () => setFinalState(createTimestampState(Date.now(), None));
}

 function getOnClearBtnClick(setFinalState: (state: DatePickerState) => void) {
     return () => setFinalState(createInputState(''));
 }

 function getOnToggleMonthPopup(setMonthPopupShow: React.Dispatch<React.SetStateAction<boolean>>) {
     return () => setMonthPopupShow(prevMonthPopup => !prevMonthPopup);
 }

 function getOnMonthPopupMiss(element: HTMLDivElement | null, setMonthPopupShow: React.Dispatch<React.SetStateAction<boolean>>) {
     return (e: React.MouseEvent<HTMLElement>) => {
        if (element && !element.contains(e.target as Node) && (<HTMLButtonElement>e.target).id !== 'btnDpMonthPopup') setMonthPopupShow(false);
      }
 }

 function getOnMonthChoice(currentState: DatePickerState, setFinalState: (state: DatePickerState) => void, setMonthPopupShow: React.Dispatch<React.SetStateAction<boolean>>) {
    return (e: MouseEvent) => {
        const newPopupDate = { year: currentState.popupDate!.year, month: +e.target.dataset.month };
        setMonthPopupShow(false);
        setFinalState({...currentState, popupDate: newPopupDate });
    }
 }

export { 
    onTimestampChangeAction, 
    getOnKeyDown, 
    getOnChange, 
    getOnBlur, 
    getOnPopupToggle, 
    getOnDateChoice,
    getOnMonthArrowClick,
    getOnNowBtnClick,
    getOnClearBtnClick,
    getOnToggleMonthPopup,
    getOnMonthPopupMiss,
    getOnMonthChoice
};