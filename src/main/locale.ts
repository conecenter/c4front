import {Context, createContext, createElement, ReactNode, useContext} from "react";
import {getOrElse, None, Option, toOption} from "./option";
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
    dateSeparator: string
    d: 0 | 2 // no, 2-digit
    M: 0 | 2 | 3 | 4 // no, 2-digit, short name, full name
    y: 0 | 2 | 4 // no, 2-digit, 4-digit

    H: 0 | 2 // no, 2-digit
    m: 0 | 2 // no, 2-digit
    s: 0 | 2 // no, 2-digit
    S: 0 | 3 // no, 3-digit
}

interface ExtendedDateTimeFormat extends DateTimeFormat {
    hasYear: boolean
    hasMonth: boolean
    hasDay: boolean
    hasTime: boolean
    hasHours: boolean
    hasMinutes: boolean
    hasSeconds: boolean
    hasMilliseconds: boolean
}

function getExtendedDateTimeFormat(dateTimeFormat: DateTimeFormat): ExtendedDateTimeFormat {
    return {
        ...dateTimeFormat,
        hasYear: dateTimeFormat.y !== 0,
        hasMonth: dateTimeFormat.M !== 0,
        hasDay: dateTimeFormat.d !== 0,
        hasMilliseconds: dateTimeFormat.S !== 0,
        hasSeconds: dateTimeFormat.s !== 0,
        hasMinutes: dateTimeFormat.m !== 0,
        hasHours: dateTimeFormat.H !== 0,
        hasTime: dateTimeFormat.H !== 0,
    }
}

interface Locale {
    timezoneId: string
    shortName: string
    weekDays: WeekDay[]
    months: Month[]
    dateFormats: DateTimeFormat[]
    defaultDateFormat: DateTimeFormat
}

interface ExtendedLocale extends Locale {
    dateFormats: ExtendedDateTimeFormat[]
    defaultDateFormat: ExtendedDateTimeFormat

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
        dateFormats: locale.dateFormats.map(getExtendedDateTimeFormat),
        defaultDateFormat: getExtendedDateTimeFormat(locale.defaultDateFormat),
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
    return getOrElse(toOption(locale.dateFormats.find(format => format.id === formatId)), locale.defaultDateFormat)
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
    dateFormats: DateTimeFormat[] = []
    defaultDateFormat: DateTimeFormat = {
        id: 0,
        dateSeparator: '/',
        d: 2,
        M: 4,
        y: 4,

        H: 2,
        m: 2,
        s: 2,
        S: 3
    }
}

const UserLocaleContext: Context<ExtendedLocale> = createContext<ExtendedLocale>(getExtendedLocale(new DefaultLocale()))
const useUserLocale: () => ExtendedLocale = () => useContext(UserLocaleContext)

function UserLocaleProvider(locale: Locale, children: ReactNode[]) {
    return createElement(UserLocaleContext.Provider, {value: getExtendedLocale(locale)}, children)
}

export type {WeekDay, Month, DateTimeFormat, Locale, ExtendedLocale, ExtendedDateTimeFormat}
export {useUserLocale, UserLocaleProvider, getDateTimeFormat}
