import React, {createElement as el, useCallback} from 'react'
import {useSync} from "./vdom-hooks";
import {format, getTime, isValid, parse as parseDate} from 'date-fns';
import {addMinutes, addHours, addDays, addMonths, addYears} from 'date-fns';
import {setMinutes, setHours, setDate, setMonth, setYear} from 'date-fns';
import {getMinutes, getHours, getDate as getDayOfMonth, getMonth, getYear, getDaysInMonth} from 'date-fns';

function getDate(timestamp) {
    const date = new Date(timestamp);
    return isValid(date) ? date : undefined
}

function getTimestamp(date) {
    return getTime(date)
}

function formatDate(date, dateFormat, locale) {
    return format(date, dateFormat, locale)
}

const nullDate = new Date(0)

function parseStringToDate(string, timestampFormat) {
    try {
        const parsedDate = parseDate(string, timestampFormat, nullDate);
        if (isValid(parsedDate)) return parsedDate
        else return undefined
    } catch (e) {
        return undefined
    }
}

function patchToState(patch) {
    return [getDate(patch.timestamp), patch.inputStr]
}

function timestampToState(timestamp, timestampFormat, locale) {
    const date = getDate(timestamp);
    return [date, formatDate(date, timestampFormat, locale)]
}

function useInputValueSync(handlerName, serverTimestamp, timestampFormat, locale) {
    const [patches, enqueuePatch] = useSync(handlerName)
    const patch = patches.slice(-1)[0]
    const [currentDate, currentInputStr] = patch ? patchToState(patch) : timestampToState(serverTimestamp, timestampFormat, locale)
    const onChange = useCallback(event => {
        const stringInput = event.target.value
        const headers = {...event.target.headers}
        const newDate = parseStringToDate(stringInput, timestampFormat)
        if (newDate === undefined) {
            enqueuePatch({headers: headers, inputStr: stringInput})
        } else {
            console.log(newDate)
            enqueuePatch({headers: headers, timestamp: getTimestamp(newDate), inputStr: stringInput})
        }
    }, [enqueuePatch])
    const onTimestampChange = useCallback(newTimestamp => {
        const newDate = getDate(newTimestamp)
        console.log(newDate)
        enqueuePatch({headers: {}, timestamp: newTimestamp, inputStr: formatDate(newDate, timestampFormat, locale)})
    }, [enqueuePatch])
    return ({currentDate, currentInputStr, onChange, onTimestampChange})
}

function adjustDate(date, symbol, increment, cycleThroughout) {
    function getAdjusters(symbol) {
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
        }
    }

    const {add, get, set, min, max} = getAdjusters(symbol)
    if (!cycleThroughout) return add(date, increment)
    else return set(date, Math.max((get(date) + increment + max - min) % max + min, min))
}

function incrementDate(currentDate, cursorPosition, up, timestampFormat, onTimestampChange, input, cycleThroughout) {
    const supportedCharacters = 'yMdHm'

    function supportedChar(position) {
        return supportedCharacters.includes(timestampFormat[position])
    }

    const increment = up ? 1 : -1
    const position =
        supportedChar(cursorPosition) ?
            cursorPosition :
            supportedChar(cursorPosition - 1) ?
                cursorPosition - 1 :
                timestampFormat[cursorPosition + 1]
    const currentFMTChar = timestampFormat[position]
    const startPosition = timestampFormat.indexOf(currentFMTChar)
    const endPosition = timestampFormat.lastIndexOf(currentFMTChar) + 1
    input.setSelection(startPosition, endPosition)
    onTimestampChange(getTimestamp(adjustDate(currentDate, currentFMTChar, increment, cycleThroughout)))
}

const UP_KEY_CODE = 38
const DOWN_KEY_CODE = 40

export function DatePickerInputElement({timestamp, timestampFormat, locale}) {
    const {
        currentDate,
        currentInputStr,
        onChange,
        onTimestampChange
    } = useInputValueSync("datepicker", timestamp, timestampFormat, locale)
    const keyPressHandler = (event, input) => {
        if (currentDate !== undefined) {
            const cycleThroughout = !event.ctrlKey
            switch (event.keyCode) {
                case UP_KEY_CODE:
                    incrementDate(currentDate, event.target.selectionStart, true, timestampFormat, onTimestampChange, input, cycleThroughout)
                    event.preventDefault()
                    break
                case DOWN_KEY_CODE:
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