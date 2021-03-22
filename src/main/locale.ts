import {createContext, createElement, ReactNode, useContext} from "react";

interface WeekDay {
    id: number,
    shortName: string,
    fullName: string
}

interface Month {
    id: number,
    shortName: string,
    fullName: string
}

interface Locale {
    timezoneId: string
    shortName: string,
    weekDays: WeekDay[],
    months: Month[],
}

class DefaultLocale implements Locale {
    timezoneId: string = "UTC"
    shortName: string = "en";
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
    ];
    weekDays: WeekDay[] = [
        {id: 0, shortName: "Mon", fullName: "Monday"},
        {id: 1, shortName: "Tue", fullName: "Tuesday"},
        {id: 2, shortName: "Wed", fullName: "Wednesday"},
        {id: 3, shortName: "Thu", fullName: "Thursday"},
        {id: 4, shortName: "Fri", fullName: "Friday"},
        {id: 5, shortName: "Sat", fullName: "Saturday"},
        {id: 6, shortName: "Sun", fullName: "Funday"},
    ];

}

const UserLocaleContext = createContext<Locale>(new DefaultLocale)
const getUserLocale = () => useContext(UserLocaleContext)

function UserLocaleProvider(locale: Locale, children: ReactNode[]) {
    // @ts-ignore
    return createElement(UserLocaleContext.Provider, {value: locale}, children)
}

export type {WeekDay, Month, Locale}
export {getUserLocale, UserLocaleProvider}
