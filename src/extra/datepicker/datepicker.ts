import {createElement as el, useState, useMemo, useRef} from "react";
import {getDateTimeFormat, useUserLocale} from "../locale";
import {DatePickerState, useDatePickerStateSync} from "./datepicker-exchange";
import {DateSettings, formatDate, getDate} from "./date-utils";
import {mapOption, None, nonEmpty, Option} from "../../main/option";
import {useSelectionEditableInput} from "./selection-control";
import {getOnBlur, getOnChange, getOnKeyDown, onTimestampChangeAction, togglePopup} from "./datepicker-actions";
import {DatepickerCalendar} from "./datepicker-calendar";


type DatePickerServerState = TimestampServerState | InputServerState

type PopupDate = { year: number, month: number } | undefined;

interface PopupState {
    popupDate?: PopupDate
}

interface InputServerState extends PopupState {
    tp: 'input-state',
    inputValue: string,
    tempTimestamp?: string
}

interface TimestampServerState extends PopupState {
    tp: 'timestamp-state',
    timestamp: string
}


interface DatePickerProps {
    key: string
    identity: Object
    state: DatePickerServerState
    timestampFormatId: number
    userTimezoneId?: string,
    deferredSend?: boolean
}

export function DatePickerInputElement({
                                           identity,
                                           state,
                                           timestampFormatId,
                                           userTimezoneId,
                                           deferredSend
                                       }: DatePickerProps) {
    const locale = useUserLocale()
    const timezoneId = userTimezoneId ? userTimezoneId : locale.timezoneId
    const timestampFormat = getDateTimeFormat(timestampFormatId, locale)
    const dateSettings: DateSettings = {timestampFormat: timestampFormat, locale: locale, timezoneId: timezoneId}
    const {
        currentState,
        setTempState,
        setFinalState
    } = useDatePickerStateSync(identity, state, deferredSend || false)
    const {
        date: currentDateOpt,
        dateFormat,
        inputValue
    } = useMemo(() => getCurrentProps(currentState, dateSettings), [currentState, dateSettings])
    const inputRef = useRef<HTMLInputElement>()
    const setSelection: (from: number, to: number) => void = useSelectionEditableInput(inputRef)
    const onTimestampChange: (timestamp: number) => void = onTimestampChangeAction(setTempState)
    const onKeyDown = getOnKeyDown(currentDateOpt, dateFormat, dateSettings, onTimestampChange, setSelection)
    const onChange = getOnChange(dateSettings, currentState.popupDate, setTempState)
    const onBlur = getOnBlur(currentState, setFinalState)

    const handleClick = togglePopup(currentDateOpt, currentState, setFinalState);

    return el('div', null,
        el("div", {className: "inputBox"},
            el("div", {className: "inputSubBox"},
                el("input", {
                    ref: inputRef,
                    value: inputValue,
                    onChange: onChange,
                    onKeyDown: onKeyDown,
                    onBlur: onBlur
                })
            ),
            el('button', {
                type: 'button', 
                className: 'btnCalendar',
                onClick: handleClick
            }),        
        ),
        currentState.popupDate && el(DatepickerCalendar, {
            popupDate: currentState.popupDate
        })
    )
}

interface CurrentProps {
    date: Option<Date>
    dateFormat: Option<string>
    inputValue: string
}

function getCurrentProps(currentState: DatePickerState, dateSettings: DateSettings): CurrentProps {
    switch (currentState.tp) {
        case "input-state":
            return {date: None, dateFormat: None, inputValue: currentState.inputValue,}
        case "timestamp-state":
            const date = getDate(currentState.timestamp, dateSettings)
            const formatInfo = mapOption(date, date => formatDate(date, dateSettings))
            const [formattedDate, dateFormat] = nonEmpty(formatInfo) ? formatInfo : ["", None]
            return {date: date, dateFormat: dateFormat, inputValue: formattedDate,}
    }
}

export const components = {DatePickerInputElement}
export type {DatePickerServerState, PopupState, PopupDate}
