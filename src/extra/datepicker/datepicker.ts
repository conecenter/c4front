import {createElement as el, useMemo, useRef} from "react";
import {getDateTimeFormat, UserLocaleProvider, useUserLocale} from "../locale";
import {DatePickerState, useDatePickerStateSync} from "./datepicker-exchange";
import {DateSettings, formatDate, getDate} from "./date-utils";
import {mapOption, None, nonEmpty, Option} from "../../main/option";
import {useSelectionEditableInput} from "./selection-control";
import {getOnBlur, getOnChange, getOnKeyDown, onTimestampChangeAction} from "./datepicker-actions";


interface DatePickerProps {
    key: string
    identity: Object
    state: DatePickerState
    timestampFormatId: number
    userTimezoneId?: string,
    deferredSend?: boolean
}

export function DatePickerInputElement({identity, state, timestampFormatId, userTimezoneId, deferredSend}: DatePickerProps) {
    const locale = useUserLocale()
    const timezoneId = userTimezoneId ? userTimezoneId : locale.timezoneId
    const timestampFormat = getDateTimeFormat(timestampFormatId, locale)
    const dateSettings: DateSettings = {timestampFormat: timestampFormat, locale: locale, timezoneId: timezoneId}
    const {
        currentState: currentState,
        setTempState: setTempState,
        setFinalState: setFinalState
    } = useDatePickerStateSync(identity, state, deferredSend || false)
    const {date: currentDateOpt, dateFormat, inputValue} = useMemo(() => getCurrentProps(currentState, dateSettings), [currentState, dateSettings])
    const inputRef = useRef<HTMLInputElement>()
    const setSelection: (from: number, to: number) => void = useSelectionEditableInput(inputRef)
    const onTimestampChange: (timestamp: number) => void = onTimestampChangeAction(setTempState)
    const onKeyDown = getOnKeyDown(currentDateOpt, dateFormat, dateSettings, onTimestampChange, setSelection)
    const onChange = getOnChange(dateSettings, setTempState)
    const onBlur = getOnBlur(currentState, setFinalState)
    return el("div", {className: "inputBox"},
        el("div", {className: "inputSubBox"},
            el("input", {
                ref: inputRef,
                value: inputValue,
                onChange: onChange,
                onKeyDown: onKeyDown,
                onBlur: onBlur,
            })
        )
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
