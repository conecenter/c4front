import React, {createElement as el, KeyboardEvent, RefObject, useEffect, useState} from "react";
import {DOWN_ARROW_KEY, UP_ARROW_KEY} from "../keys";
import {getUserLocale} from "../locale";
import {createTimestampState, DatePickerState, useDatePickerStateSync} from "./datepicker-exchange";
import {DateSettings, formatDate, getDate, incrementDate} from "./date-utils";


function updateAndSendDate(
    currentDate: Date,
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
    } = incrementDate(currentDate, dateSettings, cursorPosition, up, cycleThroughout)
    focusChange(startPosition, endPosition)
    onTimestampChange(timestamp)
}

const onTimestampChangeAction = (setState: (state: DatePickerState) => void) => (timestamp: number): void => {
    setState(createTimestampState(timestamp))
};


interface DatePickerProps {
    key: string;
    state: DatePickerState;
    timestampFormat: string;
    userTimezoneId?: string;
}

export function DatePickerInputElement({state, timestampFormat, userTimezoneId}: DatePickerProps) {
    const locale = getUserLocale()
    const timezoneId = userTimezoneId ? userTimezoneId : locale.timezoneId
    const dateSettings: DateSettings = {
        timestampFormat: timestampFormat,
        locale: locale,
        timezoneId: timezoneId
    }
    const {
        state: currentState,
        setState: onStateChange
    } = useDatePickerStateSync("datepicker", state)
    const currentDate = getDate(currentState.timestamp, dateSettings)
    const currentValue = formatDate(currentDate, dateSettings)
    const inputRef = React.createRef<HTMLInputElement>()
    const setSelection: (from: number, to: number) => void = useSelectionEditableInput(inputRef)
    const onTimestampChange: (timestamp: number) => void = onTimestampChangeAction(onStateChange)
    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (currentDate !== undefined) {
            const cycleThroughout = !event.ctrlKey
            const target = <HTMLInputElement>event.target
            const selectionStart = target.selectionStart ? target.selectionStart : 0
            switch (event.code) {
                case UP_ARROW_KEY.code:
                    updateAndSendDate(currentDate, dateSettings, selectionStart, true, cycleThroughout, onTimestampChange, setSelection)
                    event.preventDefault()
                    break
                case DOWN_ARROW_KEY.code:
                    updateAndSendDate(currentDate, dateSettings, selectionStart, false, cycleThroughout, onTimestampChange, setSelection)
                    event.preventDefault()
                    break
            }
        }
    }
    return el("div", {className: "inputBox"},
        el("div", {className: "inputSubBox"},
            el("input", {
                ref: inputRef,
                value: currentValue,
                onChange: ev => {
                },
                onKeyDown: onKeyDown
            })
        )
    )
}

interface SelectionState {
    needsSet: boolean,
    startPosition: number,
    endPosition: number
}

const initialSelectionState: SelectionState = {
    needsSet: false,
    startPosition: 0,
    endPosition: 0,
}

function useSelectionEditableInput(inputElement: RefObject<HTMLInputElement>): (from: number, to: number) => void {
    const [selectionState, setSelectionState] = useState<SelectionState>(initialSelectionState)
    const setSelection = (from: number, to: number): void => {
        setSelectionState((state: SelectionState) => ({...state, needsSet: true, startPosition: from, endPosition: to}))
    }
    useEffect(() => {
        if (inputElement.current && selectionState.needsSet) {
            const current = inputElement.current
            const {selectionStart, selectionEnd} = current;
            const update = selectionState.startPosition !== selectionStart || selectionState.endPosition !== selectionEnd;
            if (update) {
                current.selectionStart = selectionState.startPosition;
                current.selectionEnd = selectionState.endPosition;
                setSelectionState((state: SelectionState) => ({...state, needsSet: false}))
            }
        }
    }, [selectionState])
    return setSelection
}

export function DatePickerTest() {
    const [timestamp, setTimestamp] = useState(1609459200000)
    const date = new Date(timestamp)
    const value = date.getDate() + ""
    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        switch (event.code) {
            case "ArrowUp":
                setTimestamp(prev => prev + 24 * 60 * 60 * 1000)
                event.preventDefault() // to prevent default action of moving cursor to start of input
                break
            case "ArrowDown":
                setTimestamp(prev => prev - 24 * 60 * 60 * 1000)
                event.preventDefault() // to prevent default action of moving cursor to end of input
                break
        }
    }
    return el("input", {
        value: value,
        onKeyDown: onKeyDown,
    })
}