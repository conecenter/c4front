import {mapOption, None, nonEmpty, Option} from "../../main/option";
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
import {ExtendedDateTimeFormat, ExtendedLocale} from "../locale";

interface DateSettings {
    timezoneId: string,
    timestampFormat: ExtendedDateTimeFormat,
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
    const locale: ExtendedLocale = dateSettings.locale
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
            const shortName = locale.getMonthNameShort(date.getMonth())
            formattedDate.push(shortName)
            formatString.push("M".repeat(shortName.length))
            break
        case 4:
            const fullName = locale.getMonthNameFull(date.getMonth())
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
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
}

type SetResult = "unchanged" | "changed" | "error"

function changeTime(date: Date, tokens: Token[], dateFormat: ExtendedDateTimeFormat): [Date, SetResult] {
    if (dateFormat.hasTime) {
        const timeToken = <TimeToken | undefined>tokens.find((value: Token) => value.type === 'time')
        if (timeToken) {
            if (dateFormat.hasHours) date.setHours(timeToken.H)
            if (dateFormat.hasMinutes) date.setMinutes(timeToken.m)
            if (dateFormat.hasSeconds && timeToken.s) date.setSeconds(timeToken.s)
            if (dateFormat.hasMilliseconds && timeToken.S) date.setMilliseconds(timeToken.S)
            return [date, "changed"]
        } else return [date, "unchanged"]
    } else return [date, "unchanged"]
}

function changeMonth(date: Date, tokens: Token[], dateSettings: DateSettings): [Date, SetResult] {
    if (dateSettings.timestampFormat.hasMonth) {
        const monthIndex = tokens.findIndex((value: Token) => value.type === 'month')
        if (monthIndex >= 0) {
            const monthToken = <MonthToken>tokens[monthIndex]
            const monthIdOpt: Option<number> = mapOption(dateSettings.locale.getMonthByPrefix(monthToken.value), month => month.id)
            if (nonEmpty(monthIdOpt) && monthIndex <= 1) {
                date.setMonth(monthIdOpt)
                return [date, "changed"]
            } else return [date, "error"]
        } else return [date, "unchanged"]
    } else return [date, "unchanged"]
}

function changeDate(date: Date, tokens: Token[], changedTime: boolean, changedMonth: boolean, format: ExtendedDateTimeFormat): [Date, SetResult] {
    const dateTokens: number[] = tokens.flatMap(token => token.type === 'number' ? [token.value] : [])
    const days = format.hasDay ? dateTokens.shift() : undefined
    const months = format.hasMonth && !changedMonth ? dateTokens.shift() : undefined
    const years = format.hasYear ? dateTokens.shift() : undefined
    if (years !== undefined) {
        const year = years < 100 ? Math.floor(date.getFullYear() / 100) * 100 + years : years
        if (months !== undefined)
            if (days !== undefined) date.setFullYear(year, months - 1, days)
            else date.setFullYear(year, months - 1)
        else date.setFullYear(year)
    } else if (months !== undefined)
        if (days !== undefined) date.setMonth(months - 1, days)
        else date.setMonth(months - 1)
    else if (days !== undefined)
        date.setDate(days)
    if (!changedTime) {
        if (format.hasHours && dateTokens.length > 0) {
            const value = dateTokens.shift()
            if (value !== undefined) date.setHours(value)
        }
        if (format.hasMinutes && dateTokens.length > 0) {
            const value = dateTokens.shift()
            if (value !== undefined) date.setMinutes(value)
        }
        if (format.hasSeconds && dateTokens.length > 0) {
            const value = dateTokens.shift()
            if (value !== undefined) date.setSeconds(value)
        }
        if (format.hasMilliseconds && dateTokens.length > 0) {
            const value = dateTokens.shift()
            if (value !== undefined) date.setMilliseconds(value)
        }
    }
    return [date, "changed"]
}

function parseStringToDate(value: string, dateSettings: DateSettings): Option<number> {
    const tokens = tokenizeString(value)
    if (tokens.length > 0) {
        const prototypeDate = getPrototypeDate()
        const [timeDate, timeResult] = changeTime(prototypeDate, tokens, dateSettings.timestampFormat)
        if (timeResult === "error") return None
        const [monthDate, monthResult] = changeMonth(timeDate, tokens, dateSettings)
        if (monthResult === "error") return None
        const [dateDate, dateResult] = changeDate(monthDate, tokens, timeResult === "changed", monthResult === "changed", dateSettings.timestampFormat)
        if (dateResult === "error") return None
        console.log(dateDate)
        console.log(zonedTimeToUtc(dateDate, dateSettings.timezoneId))
        return zonedTimeToUtc(dateDate, dateSettings.timezoneId).getTime()
    } else return None
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