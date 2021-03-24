import React, {createElement as el} from "react";
import {getDateTimeFormat, getUserLocale} from "../../main/locale";
import {DatePickerState, useDatePickerStateSync} from "./datepicker-exchange";
import {DateSettings, formatDate, getDate} from "./date-utils";
import {getOrElse, mapOption, None, Option} from "../../main/option";
import {useSelectionEditableInput} from "./selection-control";
import {getOnChange, getOnKeyDown, onTimestampChangeAction} from "./datepicker-actions";


interface DatePickerProps {
    key: string;
    state: DatePickerState;
    timestampFormatId: number;
    userTimezoneId?: string;
}

export function DatePickerInputElement({state, timestampFormatId, userTimezoneId}: DatePickerProps) {
    const locale = getUserLocale()
    const timezoneId = userTimezoneId ? userTimezoneId : locale.timezoneId
    const timestampFormat = getDateTimeFormat(timestampFormatId, locale)
    const dateSettings: DateSettings = {timestampFormat: timestampFormat, locale: locale, timezoneId: timezoneId}
    const {state: currentState, setState: onStateChange} = useDatePickerStateSync("datepicker", state)
    const [currentDateOpt, currentInputStr] = getCurrentProps(currentState, dateSettings)
    const inputRef = React.createRef<HTMLInputElement>()
    const setSelection: (from: number, to: number) => void = useSelectionEditableInput(inputRef)
    const onTimestampChange: (timestamp: number) => void = onTimestampChangeAction(onStateChange)
    const onKeyDown = getOnKeyDown(currentDateOpt, dateSettings, onTimestampChange, setSelection)
    const onChange = getOnChange(onStateChange)
    return el("div", {className: "inputBox"},
        el("div", {className: "inputSubBox"},
            el("input", {
                ref: inputRef,
                value: currentInputStr,
                onChange: onChange,
                onKeyDown: onKeyDown
            })
        )
    )
}

function getCurrentProps(currentState: DatePickerState, dateSettings: DateSettings): [Option<Date>, string] {
    switch (currentState.type) {
        case "input-state":
            return [None, currentState.inputValue]
        case "timestamp-state":
            const date = getDate(currentState.timestamp, dateSettings)
            return [date, getOrElse(mapOption(date, date => formatDate(date, dateSettings)), "")]
    }
}
