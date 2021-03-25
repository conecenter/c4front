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

interface Locale {
    timezoneId: string
    shortName: string
    weekDays: WeekDay[]
    months: Month[]
    dateFormats: DateTimeFormat[]
    defaultDateFormat: DateTimeFormat
}

class ExtendedLocale implements Locale {
    private innerLocale!: Locale
    private monthMap: Map<number, Month>
    // @ts-ignore
    private monthFullNameTree: TrieSearch
    dateFormats: DateTimeFormat[];
    defaultDateFormat: DateTimeFormat;
    months: Month[];
    shortName: string;
    timezoneId: string;
    weekDays: WeekDay[];

    constructor(innerLocale: Locale) {
        this.innerLocale = innerLocale
        this.timezoneId = this.innerLocale.timezoneId
        this.shortName = this.innerLocale.shortName
        this.weekDays = this.innerLocale.weekDays
        this.months = this.innerLocale.months
        this.dateFormats = this.innerLocale.dateFormats
        this.defaultDateFormat = this.innerLocale.defaultDateFormat

        this.monthMap = new Map(innerLocale.months.map(month => [month.id, month]))
        this.monthFullNameTree = new TrieSearch('fullName')
        this.monthFullNameTree.addAll(innerLocale.months)
    }


    getMonthShort(id: number): string {
        return this.monthMap.get(id)?.shortName || ""
    }

    getMonthFull(id: number): string {
        return this.monthMap.get(id)?.fullName || ""
    }

    getMonthByPrefix(prefix: string): Option<Month> {
        const months = <Month[]>this.monthFullNameTree.get(prefix)
        return months.length === 1 ? months[0] : None
    }
}

function getDateTimeFormat(formatId: number, locale: Locale): DateTimeFormat {
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

const UserLocaleContext: Context<ExtendedLocale> = createContext<ExtendedLocale>(new ExtendedLocale(new DefaultLocale()))
const useUserLocale: () => ExtendedLocale = () => useContext(UserLocaleContext)

function UserLocaleProvider(locale: Locale, children: ReactNode[]) {
    return createElement(UserLocaleContext.Provider, {value: new ExtendedLocale(locale)}, children)
}

export type {WeekDay, Month, DateTimeFormat, Locale, ExtendedLocale}
export {useUserLocale, UserLocaleProvider, getDateTimeFormat}
