import {None, Option} from "../../main/option";
import {utcToZonedTime, zonedTimeToUtc} from "date-fns-tz";
import {
    addDays,
    addHours,
    addMinutes,
    addMonths,
    addYears,
    getDate as getDayOfMonth,
    getDaysInMonth,
    getHours,
    getMinutes,
    getMonth,
    getTime,
    getYear,
    isValid,
    setDate,
    setHours,
    setMinutes,
    setMonth,
    setYear
} from "date-fns";
import {DateTimeFormat, Locale} from "../../main/locale";

interface DateSettings {
    timezoneId: string,
    timestampFormat: DateTimeFormat,
    locale: Locale
}

function getDate(timestamp: number, dateSettings: DateSettings): Option<Date> {
    const date: Date = utcToZonedTime(new Date(timestamp), dateSettings.timezoneId);
    return isValid(date) ? date : None
}

function getTimestamp(date: Date, dateSettings: DateSettings): number {
    return getTime(zonedTimeToUtc(date, dateSettings.timezoneId))
}

function formatDate(date: Date, dateSettings: DateSettings): string { // TODO rewrite
    const locale = dateSettings.locale
    const result: string[] = []
    let {dateSeparator, d, M, Y, h, m, s, S} = dateSettings.timestampFormat

    function pad(num: number, size: number): string {
        let value = String(num).slice(-size)
        while (value.length < size) value = "0" + num
        return value;
    }

    switch (d) {
        case 2:
            result.push(pad(date.getDate(), 2))
    }
    if (d !== 0 && M !== 0) result.push(dateSeparator)
    switch (M) {
        case 2:
            result.push(pad(date.getMonth() + 1, 2))
            break
        case 3:
            result.push(locale.months.find(month => month.id === date.getMonth()).shortName)
            break
        case 4:
            result.push(locale.months.find(month => month.id === date.getMonth()).fullName)
            break
    }
    if (M !== 0 && Y !== 0) result.push(dateSeparator)
    switch (Y) {
        case 2:
            result.push(pad(date.getFullYear(), 2))
            break
        case 4:
            result.push(pad(date.getFullYear(), 4))
            break
    }
    if (h !== 0) result.push(" ")
    switch (h) {
        case 2:
            result.push(pad(date.getHours(), 2))
            break
    }
    if (h !== 0 && m !== 0) result.push(":")
    switch (m) {
        case 2:
            result.push(pad(date.getMinutes(), 2))
            break
    }
    if (m !== 0 && s !== 0) result.push(":")
    switch (s) {
        case 2:
            result.push(pad(date.getSeconds(), 2))
            break
    }
    if (s !== 0 && S !== 0) result.push(".")
    switch (S) {
        case 3:
            result.push(pad(date.getMilliseconds(), 3))
    }
    return result.join("")
}

const nullDate: Date = new Date(0)

function parseStringToDate(value: string, dateSettings: DateSettings): Option<Date> {
    try {
        return new Date() // todo rewrite
    } catch (e) {
        return None
    }
}

function adjustDate(date: Date, symbol: string, increment: number, cycleThroughout: boolean): Date {
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

interface IncrementDateResult {
    timestamp: number,
    startPosition: number,
    endPosition: number
}

function incrementDate(
    currentDate: Date,
    dateSettings: DateSettings,
    cursorPosition: number,
    up: boolean,
    cycleThroughout: boolean): IncrementDateResult {
    const supportedCharacters = 'yMdHm'

    function supportedChar(position: number) {
        return supportedCharacters.includes(dateSettings.timestampFormat[position])
    }

    const increment = up ? 1 : -1
    const position: number =
        supportedChar(cursorPosition) ?
            cursorPosition :
            supportedChar(cursorPosition - 1) ?
                cursorPosition - 1 :
                cursorPosition + 1
    const currentFMTChar = dateSettings.timestampFormat[position]
    const startPosition = dateSettings.timestampFormat.indexOf(currentFMTChar)
    const endPosition = dateSettings.timestampFormat.lastIndexOf(currentFMTChar) + 1
    const adjustedDate = adjustDate(currentDate, currentFMTChar, increment, cycleThroughout)
    return {timestamp: getTimestamp(adjustedDate, dateSettings), startPosition, endPosition}
}

export {incrementDate, formatDate, getDate}
export type {DateSettings}