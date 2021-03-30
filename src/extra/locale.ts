import {Context, createContext, createElement, ReactNode, useContext, useMemo} from "react";
import {getOrElse, None, Option, toOption} from "../main/option";
// @ts-ignore
import TrieSearch from "trie-search";

interface WeekDay {
    id: number
    shortName: string
    fullName: string
}

interface Month {
    id: number
    shortName: string
    fullName: string
}

interface DateTimeFormat {
    id: number
    pattern: string
}

interface Locale {
    timezoneId: string
    shortName: string
    weekDays: WeekDay[]
    months: Month[]
    dateTimeFormats: DateTimeFormat[]
    defaultDateTimeFormatId: number
}

interface TextFormatToken {
    type: "text"
    text: string
}

interface DateFormatToken {
    type: "date"
    dateSymbol: string
    format: number
}

type FormatToken = TextFormatToken | DateFormatToken
const isDateFormatToken = (token: FormatToken | undefined): token is DateFormatToken => token !== undefined && token.type === "date"

interface ExtendedDateTimeFormat extends DateTimeFormat {
    formatTokens: FormatToken[]

    has(type: string): boolean

    hasTime: boolean

    get(type: string): DateFormatToken | undefined
}

const supportedTokens = new Set(["d", "M", "y", "H", "m", "s", "S"])
const supportedTimeTokens = new Set(["H", "m", "s", "S"])

function getExtendedDateTimeFormat(dateTimeFormat: DateTimeFormat): ExtendedDateTimeFormat {
    const pattern = dateTimeFormat.pattern.replace(/'(([^']|'')*)'/, (match, match2: string) => match2).replace(/''/, "'")
    const tokens: FormatToken[] = []
    let counter: number = 0

    function dateLookAhead(target: string): number {
        const start = counter
        while (pattern[counter] === target) {
            counter++
        }
        return counter - start
    }

    function textLookAhead(): string {
        const result = []
        while (pattern[counter] !== undefined && !supportedTokens.has(pattern[counter])) {
            result.push(pattern[counter])
            counter++
        }
        return result.join("")
    }

    while (counter < pattern.length) {
        if (supportedTokens.has(pattern[counter]))
            tokens.push({
                type: "date",
                dateSymbol: pattern[counter],
                format: dateLookAhead(pattern[counter])
            })
        else tokens.push({
            type: "text",
            text: textLookAhead()
        })
    }
    const dateTokens = tokens.filter(isDateFormatToken)
    const tokensMap: Map<string, DateFormatToken> = new Map(dateTokens.map(token => [token.dateSymbol, token]))
    return {
        ...dateTimeFormat,
        formatTokens: tokens,
        has(type: string): boolean {
            return tokensMap.has(type)
        },
        hasTime: dateTokens.filter(token => supportedTimeTokens.has(token.dateSymbol)).length > 0,
        get(type: string) {
            return tokensMap.get(type)
        },
    }
}

interface ExtendedLocale extends Locale {
    dateTimeFormats: ExtendedDateTimeFormat[]
    defaultDateTimeFormat: ExtendedDateTimeFormat

    getMonthNameShort(id: number): string

    getMonthNameFull(id: number): string

    getMonthByPrefix(prefix: string): Option<Month>
}

function getExtendedLocale(locale: Locale): ExtendedLocale {
    const monthMap = new Map(locale.months.map(month => [month.id, month]))
    const monthFullNameTree = new TrieSearch('fullName')
    monthFullNameTree.addAll(locale.months)
    return ({
        ...locale,
        dateTimeFormats: locale.dateTimeFormats.map(getExtendedDateTimeFormat),
        defaultDateTimeFormat: getExtendedDateTimeFormat(<DateTimeFormat>locale.dateTimeFormats.find(value => value.id === locale.defaultDateTimeFormatId)),
        getMonthNameShort(id: number): string {
            return monthMap.get(id)?.shortName || ""
        },
        getMonthNameFull(id: number): string {
            return monthMap.get(id)?.fullName || ""
        },
        getMonthByPrefix(prefix: string): Option<Month> {
            const months = <Month[]>monthFullNameTree.get(prefix)
            return months.length === 1 ? months[0] : None
        }
    })
}


function getDateTimeFormat(formatId: number, locale: ExtendedLocale): ExtendedDateTimeFormat {
    return getOrElse(toOption(locale.dateTimeFormats.find(format => format.id === formatId)), locale.defaultDateTimeFormat)
}

class DefaultLocale implements Locale {
    timezoneId: string = "UTC"
    shortName: string = "en"
    months: Month[] = [
        {id: 0, shortName: "Jan", fullName: "January"},
        {id: 1, shortName: "Feb", fullName: "February"},
        {id: 2, shortName: "Mar", fullName: "March"},
        {id: 3, shortName: "Apr", fullName: "April"},
        {id: 4, shortName: "May", fullName: "May"},
        {id: 5, shortName: "Jun", fullName: "June"},
        {id: 6, shortName: "Jul", fullName: "July"},
        {id: 7, shortName: "Aug", fullName: "August"},
        {id: 8, shortName: "Sep", fullName: "September"},
        {id: 9, shortName: "Oct", fullName: "October"},
        {id: 10, shortName: "Nov", fullName: "November"},
        {id: 11, shortName: "Dec", fullName: "December"},
    ]
    weekDays: WeekDay[] = [
        {id: 0, shortName: "Mon", fullName: "Monday"},
        {id: 1, shortName: "Tue", fullName: "Tuesday"},
        {id: 2, shortName: "Wed", fullName: "Wednesday"},
        {id: 3, shortName: "Thu", fullName: "Thursday"},
        {id: 4, shortName: "Fri", fullName: "Friday"},
        {id: 5, shortName: "Sat", fullName: "Saturday"},
        {id: 6, shortName: "Sun", fullName: "Sunday"},
    ]
    dateTimeFormats: DateTimeFormat[] = [{
        id: 0,
        pattern: "dd/MMMM/yyyy HH:mm:ss.SSS"
    }]
    defaultDateTimeFormatId: number = 0
}

const UserLocaleContext: Context<ExtendedLocale> = createContext<ExtendedLocale>(getExtendedLocale(new DefaultLocale()))
const useUserLocale: () => ExtendedLocale = () => useContext(UserLocaleContext)

interface UserLocaleProviderProps {
    key: string,
    locale: Locale,
    children: ReactNode[]
}

function UserLocaleProvider({key, children, locale}: UserLocaleProviderProps) {
    const extendedLocale = useMemo(()=>getExtendedLocale(locale),[locale])
    return createElement(UserLocaleContext.Provider, {key: key, value: getExtendedLocale(locale)}, children)
}

export type {
    WeekDay,
    Month,
    DateTimeFormat,
    Locale,
    ExtendedLocale,
    ExtendedDateTimeFormat,
    FormatToken,
    TextFormatToken,
    DateFormatToken
}
export {useUserLocale, UserLocaleProvider, getDateTimeFormat, isDateFormatToken}

export const components = {UserLocaleProvider}