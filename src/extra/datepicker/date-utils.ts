import {getOrElse, mapOption, None, nonEmpty, Option, toOption} from "../../main/option";
import {utcToZonedTime, zonedTimeToUtc} from "date-fns-tz";
import {
    addDays,
    addHours,
    addMilliseconds,
    addMinutes,
    addMonths,
    addSeconds,
    addYears,
    getDate as getDayOfMonth,
    getDaysInMonth,
    getHours,
    getMilliseconds,
    getMinutes,
    getMonth,
    getSeconds,
    getTime,
    getYear,
    isValid,
    setDate,
    setHours,
    setMilliseconds,
    setMinutes,
    setMonth,
    setSeconds,
    setYear
} from "date-fns";
import {DateTimeFormat, ExtendedLocale, Month} from "../../main/locale";

interface DateSettings {
    timezoneId: string,
    timestampFormat: DateTimeFormat,
    locale: ExtendedLocale
}

function getDate(timestamp: number, dateSettings: DateSettings): Option<Date> {
    const date: Date = utcToZonedTime(new Date(timestamp), dateSettings.timezoneId);
    return isValid(date) ? date : None
}

function getTimestamp(date: Date, dateSettings: DateSettings): number {
    return getTime(zonedTimeToUtc(date, dateSettings.timezoneId))
}

function formatDate(date: Date, dateSettings: DateSettings): [string, string] {
    const locale = dateSettings.locale
    const formattedDate: string[] = []
    const formatString: string[] = []
    let {dateSeparator, d, M, y, H, m, s, S} = dateSettings.timestampFormat

    function pad(num: number, size: number): string {
        let value = String(num).slice(-size)
        return "0".repeat(size - value.length) + value;
    }

    switch (d) {
        case 2:
            formattedDate.push(pad(date.getDate(), 2))
            formatString.push("dd")
    }
    if (d !== 0 && M !== 0) {
        formattedDate.push(dateSeparator)
        formatString.push("d")
    }
    switch (M) {
        case 2:
            formattedDate.push(pad(date.getMonth() + 1, 2))
            formatString.push("MM")
            break
        case 3:
            const shortName = locale.getMonthShort(date.getMonth())
            formattedDate.push(shortName)
            formatString.push("M".repeat(shortName.length))
            break
        case 4:
            const fullName = locale.getMonthFull(date.getMonth())
            formattedDate.push(fullName)
            formatString.push("M".repeat(fullName.length))
            break
    }
    if (M !== 0 && y !== 0) {
        formattedDate.push(dateSeparator)
        formatString.push("M")
    }
    switch (y) {
        case 2:
            formattedDate.push(pad(date.getFullYear(), 2))
            formatString.push("yy")
            break
        case 4:
            formattedDate.push(pad(date.getFullYear(), 4))
            formatString.push("yyyy")
            break
    }
    if (H !== 0) {
        formattedDate.push(" ")
        formatString.push("y")
    }
    switch (H) {
        case 2:
            formattedDate.push(pad(date.getHours(), 2))
            formatString.push("HH")
            break
    }
    if (H !== 0 && m !== 0) {
        formattedDate.push(":")
        formatString.push("H")
    }
    switch (m) {
        case 2:
            formattedDate.push(pad(date.getMinutes(), 2))
            formatString.push("mm")
            break
    }
    if (m !== 0 && s !== 0) {
        formattedDate.push(":")
        formatString.push("m")
    }
    switch (s) {
        case 2:
            formattedDate.push(pad(date.getSeconds(), 2))
            formatString.push("ss")
            break
    }
    if (s !== 0 && S !== 0) {
        formattedDate.push(".")
        formatString.push("s")
    }
    switch (S) {
        case 3:
            formattedDate.push(pad(date.getMilliseconds(), 3))
            formatString.push("SSS")
            break
    }
    return [formattedDate.join(""), formatString.join("")]
}

interface NumberToken {
    type: 'number'
    value: number
    length: number
}

interface MonthToken {
    type: 'month'
    value: string
    length: number
}

interface TimeToken {
    type: 'time'
    H: number
    m: number
    s?: number
    S?: number
    length: number
}

type Token = NumberToken | MonthToken | TimeToken

interface RegExpExtractor {
    regex: RegExp
    extractor: (match: string[]) => Token
}

const number: RegExpExtractor = {
    regex: /^([0-9]+)/,
    extractor: match => ({type: 'number', value: parseInt(match[0]) || 0, length: match[0].length})
}
const month: RegExpExtractor = {
    regex: /^([\p{Letter}]+)/iu,
    extractor: match => ({type: 'month', value: match[0], length: match[0].length})
}
const Hm: RegExpExtractor = {
    regex: /^(\d{1,2}):(\d{1,2})/,
    extractor: match => ({
        type: 'time',
        H: parseInt(match[1]) || 0,
        m: parseInt(match[2]) || 0,
        length: match[0].length
    })
}
const Hms: RegExpExtractor = {
    regex: /^(\d{1,2}):(\d{1,2}):(\d{1,2})/,
    extractor: match => ({
        type: 'time',
        H: parseInt(match[1]) || 0,
        m: parseInt(match[2]) || 0,
        s: parseInt(match[3]) || 0,
        length: match[0].length
    })
}
const HmsS: RegExpExtractor = {
    regex: /^(\d{1,2}):(\d{1,2}):(\d{1,2})\.(\d{1,3})/,
    extractor: match => ({
        type: 'time',
        H: parseInt(match[1]) || 0,
        m: parseInt(match[2]) || 0,
        s: parseInt(match[3]) || 0,
        S: parseInt(match[4]) || 0,
        length: match[0].length
    })
}
const dateExtractors: RegExpExtractor[] = [HmsS, Hms, Hm, number, month]

function tryRegexes(value: string): Option<Token> {
    let i = 0
    while (i < dateExtractors.length) {
        const result = tryRegex(value, dateExtractors[i])
        if (nonEmpty(result)) return result
        i++
    }
    return None
}

function tryRegex(value: string, regexExtractor: RegExpExtractor): Option<Token> {
    const matchResult = value.match(regexExtractor.regex) || []
    if (matchResult.length !== 0) {
        return regexExtractor.extractor(matchResult)
    } else return None
}

function tokenizeString(value: String): Token[] {
    let currentValue = value.toLowerCase()
    const tokens: Token[] = []

    while (currentValue.length > 0) {
        const tokenOpt = tryRegexes(currentValue)
        if (nonEmpty(tokenOpt)) {
            tokens.push(tokenOpt)
            currentValue = currentValue.slice(tokenOpt.length)
        } else {
            currentValue = currentValue.slice(1)
        }
    }
    return tokens
}

function getPrototypeDate() {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
}

type SetResult = "unchanged" | "changed" | "error"

function changeTime(date: Date, tokens: Token[]): [Date, SetResult] {
    const timeToken = <TimeToken | undefined>tokens.find((value: Token) => value.type === 'time')
    if (timeToken) {
        date.setHours(timeToken.H, timeToken.m, ...[timeToken.s, timeToken.S].filter(v => v !== undefined))
    }
    return [date, timeToken ? "changed" : "unchanged"]
}

function changeMonth(date: Date, tokens: Token[], dateSettings: DateSettings): [Date, SetResult] {
    const monthToken = <MonthToken | undefined>tokens.find((value: Token) => value.type === 'month')
    const monthIdOpt: Option<number> = monthToken ? mapOption(dateSettings.locale.getMonthByPrefix(monthToken.value), month => month.id) : None
    mapOption(monthIdOpt, monthId => date.setMonth(monthId))
    return [date,
        monthToken ?
            nonEmpty(monthIdOpt) ?
                "changed" :
                "error" :
            "unchanged"]
}

function changeDate(date: Date, tokens: Token[], changedTime: boolean, changedMonth: boolean): [Date, SetResult] {
    const dateTokens: number[] = tokens.flatMap(token => token.type === 'number'? [token.value] : [])
    // todo continue here
    return [date, "changed"]
}

function parseStringToDate(value: string, dateSettings: DateSettings): Option<number> {
    const tokens = tokenizeString(value)
    const prototypeDate = getPrototypeDate()
    const [timeDate, timeResult] = changeTime(prototypeDate, tokens)
    if (timeResult === "error") return None
    const [monthDate, monthResult] = changeMonth(timeDate, tokens, dateSettings)
    if (monthResult === "error") return None
    const [dateDate, dateResult] = changeDate(monthDate, tokens, timeResult === "changed", monthResult === "changed")
    if (dateResult === "error") return None
    console.log(dateDate)
    return mapOption(dateDate, date => date.getTime())
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
            case 'd':
                return {add: addDays, get: getDayOfMonth, set: setDate, min: 1, max: getDaysInMonth(date)}
            case 'M':
                return {add: addMonths, get: getMonth, set: setMonth, min: 0, max: 12}
            case 'y':
                return {add: addYears, get: getYear, set: setYear, min: 0, max: 10000}
            case 'H':
                return {add: addHours, get: getHours, set: setHours, min: 0, max: 24}
            case 'm':
                return {add: addMinutes, get: getMinutes, set: setMinutes, min: 0, max: 60}
            case 's':
                return {add: addSeconds, get: getSeconds, set: setSeconds, min: 0, max: 60}
            case 'S':
                return {add: addMilliseconds, get: getMilliseconds, set: setMilliseconds, min: 0, max: 1000}
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
    dateFormat: string,
    dateSettings: DateSettings,
    cursorPosition: number,
    up: boolean,
    cycleThroughout: boolean
): IncrementDateResult {
    const increment = up ? 1 : -1
    const currentFMTChar = dateFormat[cursorPosition]
    const adjustedDate = adjustDate(currentDate, currentFMTChar, increment, cycleThroughout)
    const [, newFormat] = formatDate(adjustedDate, dateSettings)
    const startPosition = newFormat.indexOf(currentFMTChar)
    const endCharPosition = newFormat.lastIndexOf(currentFMTChar)
    const endPosition = endCharPosition + 1 === newFormat.length ? endCharPosition + 1 : endCharPosition
    return {timestamp: getTimestamp(adjustedDate, dateSettings), startPosition, endPosition}
}

export {incrementDate, formatDate, getDate, parseStringToDate}
export type {DateSettings}