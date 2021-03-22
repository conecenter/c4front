import {
    addDays,
    addHours,
    addMinutes,
    addMonths,
    addYears,
    format,
    getDate as getDayOfMonth,
    getDaysInMonth,
    getHours,
    getMinutes,
    getMonth,
    getTime,
    getYear,
    isValid,
    parse as parseDate,
    setDate,
    setHours,
    setMinutes,
    setMonth,
    setYear
} from "date-fns";
import {useSync} from "./vdom-hooks";
import React, {createElement as el, useCallback} from "react";
import {DOWN_ARROW_KEY, UP_ARROW_KEY} from "./keys";
import {getUserLocale, Locale} from "./locale";
import {mapOption, None, numToOption, Option, toOption} from "./option";
import {utcToZonedTime} from 'date-fns-tz';

function getDate(timestamp: number, timezoneId: string): Option<Date> {
    const date: Date = utcToZonedTime(new Date(timestamp), timezoneId);
    return isValid(date) ? date : None
}

function getTimestamp(date: Date): number {
    return getTime(date)
}

function formatDate(date: Date, timestampFormat: string, locale: Locale): string {
    return format(date, timestampFormat) // TODO custom formatter
}

const nullDate: Date = new Date(0)

function parseStringToDate(value: string, timestampFormat: string): Option<Date> {
    try {
        const parsedDate = parseDate(value, timestampFormat, nullDate);
        if (isValid(parsedDate)) return parsedDate
        else return None
    } catch (e) {
        return None
    }
}

function patchToState(patch: Patch, timezoneId: string): (Option<Date> | Option<string>)[] {
    return [mapOption(numToOption(parseInt(patch.value)), opt => getDate(opt, timezoneId)), toOption(patch.headers.get(currentInputKey))]
}

function timestampToState(timestamp: number, timestampFormat: string, timezoneId: string, locale: Locale): (Option<Date> | Option<string>)[] {
    const date = getDate(timestamp, timezoneId);
    return [date, mapOption(date, date => formatDate(date, timestampFormat, locale))]
}

interface Patch {
    headers: Headers,
    value: string
}

function useInputValueSync(handlerName: string, timestamp: number, timestampFormat: string, timezoneId: string, localState: DatePickerLocalState, locale: Locale,) {
    const [patches, enqueuePatch] = <[Patch[], (patch: Patch) => void]>useSync(handlerName)
    const patch = patches.slice(-1)[0]
    const [currentDateOpt, currentInputOpt] = patch ? patchToState(patch, timezoneId) : timestampToState(timestamp, timestampFormat, timezoneId, locale)
    const onChange = useCallback(event => {
        const stringInput = event.target.value
        const headers = localStateToHeaders()
        const newDate = parseStringToDate(stringInput, timestampFormat)
        if (newDate === undefined) {
            enqueuePatch({headers: headers, inputStr: stringInput})
        } else {
            console.log(newDate)
            enqueuePatch({headers: headers, timestamp: getTimestamp(newDate), inputStr: stringInput})
        }
    }, [enqueuePatch])
    const onTimestampChange = useCallback(newTimestamp => {
        const newDate = getDate(newTimestamp, timezoneId)
        console.log(newDate)
        enqueuePatch({headers: {}, timestamp: newTimestamp, inputStr: formatDate(newDate, timestampFormat, locale)})
    }, [enqueuePatch])
    return ({currentDate, currentInputStr, onChange, onTimestampChange})
}

function adjustDate(date: Date, symbol: string, increment: number, cycleThroughout: boolean) {
    interface Adjusters {
        add: (date: Date, value: number) => Date;
        get: (date: Date) => number;
        set: (date: Date, value: number) => Date;
        min: number;
        max: number;
    }

    function getAdjusters(symbol: string): Adjusters {
        switch (symbol) {
            case 'y':
                return {add: addYears, get: getYear, set: setYear, min: 0, max: 10000}
            case 'M':
                return {add: addMonths, get: getMonth, set: setMonth, min: 0, max: 12}
            case 'd':
                return {add: addDays, get: getDayOfMonth, set: setDate, min: 1, max: getDaysInMonth(date)}
            case 'H':
                return {add: addHours, get: getHours, set: setHours, min: 0, max: 24}
            case 'm':
                return {add: addMinutes, get: getMinutes, set: setMinutes, min: 0, max: 60}
            default:
                throw new Error("Unsupported temporal unit")
        }
    }

    const {add: add, get: get, set: set, min: min, max: max}: Adjusters = getAdjusters(symbol)
    if (!cycleThroughout) return add(date, increment)
    else return set(date, Math.max((get(date) + increment + max - min) % max + min, min))
}

function incrementDate(currentDate: Date, cursorPosition: number, up: boolean, timestampFormat: string, onTimestampChange, input, cycleThroughout: boolean) {
    const supportedCharacters = 'yMdHm'

    function supportedChar(position: number) {
        return supportedCharacters.includes(timestampFormat[position])
    }

    const increment = up ? 1 : -1
    const position: number =
        supportedChar(cursorPosition) ?
            cursorPosition :
            supportedChar(cursorPosition - 1) ?
                cursorPosition - 1 :
                cursorPosition + 1
    const currentFMTChar = timestampFormat[position]
    const startPosition = timestampFormat.indexOf(currentFMTChar)
    const endPosition = timestampFormat.lastIndexOf(currentFMTChar) + 1
    input.setSelection(startPosition, endPosition)
    onTimestampChange(getTimestamp(adjustDate(currentDate, currentFMTChar, increment, cycleThroughout)))
}

interface DatePickerLocalState {
    currentInput: string
}

const currentInputKey = "x-r-currentInput"

function localStateToHeaders(localState: DatePickerLocalState): Headers {
    return new Headers([[currentInputKey, localState.currentInput]])
}

interface DatePickerProps {
    key: string,
    timestamp: number,
    timestampFormat: string
    userTimezoneId?: string,
    localState: DatePickerLocalState
}

export function DatePickerInputElement({timestamp, timestampFormat, userTimezoneId, localState}: DatePickerProps) {
    const locale = getUserLocale()
    const timezoneId = userTimezoneId ? userTimezoneId : locale.timezoneId
    const {
        currentDate,
        currentInputStr,
        onChange,
        onTimestampChange
    } = useInputValueSync("datepicker", timestamp, timestampFormat, timezoneId, localState, locale)
    const keyPressHandler = (event, input) => {
        if (currentDate !== undefined) {
            const cycleThroughout = !event.ctrlKey
            switch (event.keyCode) {
                case UP_ARROW_KEY.keyCode:
                    incrementDate(currentDate, event.target.selectionStart, true, timestampFormat, onTimestampChange, input, cycleThroughout)
                    event.preventDefault()
                    break
                case DOWN_ARROW_KEY.keyCode:
                    incrementDate(currentDate, event.target.selectionStart, false, timestampFormat, onTimestampChange, input, cycleThroughout)
                    event.preventDefault()
                    break
            }
        }
    }
    return el("div", {className: "inputBox"},
        el("div", {className: "inputSubBox"},
            el(CursorPreservingInput, {value: currentInputStr, onChange: onChange, onKeyDown: keyPressHandler})
        )
    )
}

class CursorPreservingInput extends React.Component {
    constructor(props) {
        super(props);
        this.inputRef = React.createRef();
        this.selection = {
            start: false,
            end: false
        }
        this.wrapChangeFunc = this.wrapChangeFunc.bind(this);
    }

    setSelection(start, end) {
        this.selection = {
            start: start,
            end: end
        };
    }

    componentDidUpdate() {
        const {selectionStart, selectionEnd} = this.inputRef.current;
        const update = (this.selection.start !== false && this.selection.start !== selectionStart)
            || (this.selection.end !== false && this.selection.end !== selectionEnd);

        if (update) {
            this.inputRef.current.selectionStart = this.selection.start;
            this.inputRef.current.selectionEnd = this.selection.end;
        }
    }

    wrapChangeFunc(event, action) {
        const input = this.inputRef.current;
        this.setSelection(input.selectionStart, input.selectionEnd)
        action(event, this);
    }

    render() {
        return el("input", {
            ref: this.inputRef,
            value: this.props.value,
            onChange: ev => this.wrapChangeFunc(ev, this.props.onChange),
            onKeyDown: ev => this.wrapChangeFunc(ev, this.props.onKeyDown)
        })
    }
}