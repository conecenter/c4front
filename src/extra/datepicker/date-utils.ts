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
import {DateFormatToken, ExtendedDateTimeFormat, ExtendedLocale, FormatToken, isDateFormatToken} from "../locale";

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
    const {formatTokens} = dateSettings.timestampFormat

    function pad(num: number, size: number): string {
        let value = String(num).slice(-size)
        return "0".repeat(size - value.length) + value;
    }

    function formatDateToken(token: DateFormatToken): string {
        switch (token.dateSymbol) {
            case "d":
                return pad(date.getDate(), 2)
            case "M":
                switch (token.format) {
                    case 2:
                        return pad(date.getMonth() + 1, 2)
                    case 3:
                        return locale.getMonthNameShort(date.getMonth())
                    case 4:
                        return locale.getMonthNameFull(date.getMonth())
                    default:
                        return ""
                }
            case "y":
                if (token.format <= 2) return pad(date.getFullYear(), 2)
                else return pad(date.getFullYear(), 4)
            case "H":
                return pad(date.getHours(), 2)
            case "m":
                return pad(date.getMinutes(), 2)
            case "s":
                return pad(date.getSeconds(), 2)
            case "S":
                return pad(date.getMilliseconds(), 3)
            default:
                return ""
        }
    }

    formatTokens.forEach(((value: FormatToken, index: number, array: FormatToken[]) => {
        if (isDateFormatToken(value)) {
            const formatted = formatDateToken(value)
            formattedDate.push(formatted)
            formatString.push(value.dateSymbol.repeat(formatted.length + 1))
        } else {
            formattedDate.push(value.text)
            const pushSpaces = isDateFormatToken(array[index - 1]) ? -1 : 0
            formatString.push(" ".repeat(value.text.length + pushSpaces))
        }
    }))
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

interface TimeValue {
    H?: number
    m?: number
    s?: number
    S?: number
}

function getTimeValue(tokens: Token[], dateFormat: ExtendedDateTimeFormat): TimeValue {
    const empty: TimeValue = {}
    if (dateFormat.hasTime) {
        const timeToken = <TimeToken | undefined>tokens.find((value: Token) => value.type === 'time')
        if (timeToken) {
            return {
                ...empty,
                H: dateFormat.has("H") ? timeToken.H : undefined,
                m: dateFormat.has("m") ? timeToken.m : undefined,
                s: dateFormat.has("s") ? timeToken.s : undefined,
                S: dateFormat.has("S") ? timeToken.S : undefined,
            }
        } else return empty
    } else return empty
}

interface MonthValue {
    M?: number
}

function getMonthValue(tokens: Token[], dateSettings: DateSettings): MonthValue | undefined {
    const empty: MonthValue = {}
    if (dateSettings.timestampFormat.has("M")) {
        const monthIndex = tokens.findIndex((value: Token) => value.type === 'month')
        if (monthIndex >= 0) {
            const monthToken = <MonthToken>tokens[monthIndex]
            const monthIdOpt: Option<number> = mapOption(dateSettings.locale.getMonthByPrefix(monthToken.value), month => month.id)
            if (nonEmpty(monthIdOpt) && monthIndex <= 1)
                return {
                    ...empty,
                    M: monthIdOpt
                }
            else return undefined
        } else return empty
    } else return empty
}

function changeDate(date: Date, tokens: Token[], time: TimeValue, month: MonthValue, format: ExtendedDateTimeFormat): Date {
    const yearsToThisEpoch = (year: number | undefined): number | undefined =>
        year !== undefined ? year < 100 ? Math.floor(date.getFullYear() / 100) * 100 + year : year : undefined
    const correctMonths = (month: number | undefined): number | undefined =>
        month !== undefined ? month - 1 : undefined

    function reduce(...args: (number | undefined)[]): number {
        return args
            .filter(num => num !== undefined)
            .shift() || 0
    }

    function reduceOpt(...args: (number | undefined)[]): number | undefined {
        return args
            .filter(num => num !== undefined)
            .shift()
    }

    const dateTokens: number[] = tokens.reduce((acc: number[], token: Token) => acc.concat(token.type === 'number' ? [token.value] : []), [])
    const days = reduce(format.has("d") ? dateTokens.shift() : undefined, date.getDate())
    const months = reduce(
        format.has("M") ?
            month.M !== undefined ?
                month.M :
                correctMonths(dateTokens.shift()) :
            undefined,
        date.getMonth())
    const years = reduce(yearsToThisEpoch(format.has("y") ? dateTokens.shift() : undefined), date.getFullYear())

    const hours = reduce((format.has("H") ? time.H || dateTokens.shift() : undefined), date.getHours())
    const minutes = reduce((format.has("m") ? time.m || dateTokens.shift() : undefined), date.getMinutes())
    const seconds = reduce((format.has("s") ? time.s || dateTokens.shift() : undefined), date.getSeconds())
    const milliseconds = reduce((format.has("S") ? time.S || dateTokens.shift() : undefined), date.getMilliseconds())
    return new Date(
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
        milliseconds
    )
}

function parseStringToDate(value: string, dateSettings: DateSettings): Option<number> {
    const tokens = tokenizeString(value)
    if (tokens.length > 0) {
        const time = getTimeValue(tokens, dateSettings.timestampFormat)
        const month = getMonthValue(tokens, dateSettings)
        if (month === undefined) return None
        const prototypeDate = getPrototypeDate()
        const newDate = changeDate(prototypeDate, tokens, time, month, dateSettings.timestampFormat)
        return zonedTimeToUtc(newDate, dateSettings.timezoneId).getTime()
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