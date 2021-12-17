import {createElement as el, useMemo, useRef, useState} from "react";
import {getDateTimeFormat, useUserLocale} from "../locale";
import {DatePickerState, useDatePickerStateSync} from "./datepicker-exchange";
import {DateSettings, formatDate, getDate} from "./date-utils";
import {mapOption, None, nonEmpty, Option} from "../../main/option";
import {useSelectionEditableInput} from "./selection-control";
import {DatepickerCalendar} from "./datepicker-calendar";
import {
    getOnBlur, 
    getOnChange, 
    getOnKeyDown, 
    onTimestampChangeAction, 
    getOnPopupToggle, 
    getOnDateChoice, 
    getOnMonthArrowClick, 
    getOnTimeBtnClick, 
    getOnNowBtnClick,
    getOnClearBtnClick
} from "./datepicker-actions";


type DatePickerServerState = TimestampServerState | InputServerState

type PopupServerDate = string | undefined;

interface PopupServerState {
    popupDate?: PopupServerDate
}

interface InputServerState extends PopupServerState {
    tp: 'input-state',
    inputValue: string,
    tempTimestamp?: string
}

interface TimestampServerState extends PopupServerState {
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
    } = useDatePickerStateSync(identity, state, dateSettings, deferredSend || false)
    const {
        date: currentDateOpt,
        dateFormat,
        inputValue
    } = useMemo(() => getCurrentProps(currentState, dateSettings), [currentState, dateSettings])

    const inputRef = useRef<HTMLInputElement>()

    const setSelection: (from: number, to: number) => void = useSelectionEditableInput(inputRef)
    const onTimestampChange: (timestamp: number) => void = onTimestampChangeAction(setTempState)
    const onBlur = getOnBlur(currentState, setFinalState)
    const onKeyDown = getOnKeyDown(currentDateOpt, dateFormat, dateSettings, onTimestampChange, setSelection, onBlur)
    const onChange = getOnChange(dateSettings, setTempState)

    const onPopupToggle = getOnPopupToggle(currentDateOpt, currentState, dateSettings, setFinalState);
    const onDateChoice = getOnDateChoice(currentDateOpt, dateSettings, setFinalState);
    const onMonthArrowClick = getOnMonthArrowClick(currentState, setFinalState);
    const onTimeBtnClick = getOnTimeBtnClick(currentState, setFinalState);
    const onNowBtnClick = getOnNowBtnClick(setFinalState);
    const onClearBtnClick = getOnClearBtnClick(setFinalState);

    const [fieldEl, setFieldEl] = useState(null) // 2 рендера изначально

    console.log('render datepicker');

    return el('div', {style: {margin: '1em'}},
        el("div", {ref: setFieldEl, className: "inputBox"},
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
                onClick: onPopupToggle
            }),        
        ),
        currentState.popupDate && nonEmpty(currentState.popupDate) && el(DatepickerCalendar, {
            currentState,
            setFinalState,
            fieldEl,
            popupDate: currentState.popupDate,
            currentDateOpt,
            dateSettings,
            inputRef,
            onClickAway: onPopupToggle,
            onDateChoice,
            onMonthArrowClick,
            onTimeBtnClick,
            onNowBtnClick,
            onClearBtnClick
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
export type {DatePickerServerState}