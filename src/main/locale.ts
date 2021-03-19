import {createContext, createElement, ReactNode, useContext} from "react";

interface WeekDay {
    shortName: String,
    fullName: String
}

interface Month {
    shortName: String,
    fullName: String
}

interface Locale {
    shortName: String,
    weekDays: WeekDay[],
    months: Month[],
}

class DefaultLocale implements Locale {
    shortName: String = "en";
    months: Month[] = [
        {shortName: "Jan", fullName: "January"},
        {shortName: "Feb", fullName: "February"},
        {shortName: "Mar", fullName: "March"},
        {shortName: "Apr", fullName: "April"},
        {shortName: "May", fullName: "May"},
        {shortName: "Jun", fullName: "June"},
        {shortName: "Jul", fullName: "July"},
        {shortName: "Aug", fullName: "August"},
        {shortName: "Sep", fullName: "September"},
        {shortName: "Oct", fullName: "October"},
        {shortName: "Nov", fullName: "November"},
        {shortName: "Dec", fullName: "December"},
    ];
    weekDays: WeekDay[] = [
        {shortName: "Mon", fullName: "Monday"},
        {shortName: "Tue", fullName: "Tuesday"},
        {shortName: "Wed", fullName: "Wednesday"},
        {shortName: "Thu", fullName: "Thursday"},
        {shortName: "Fri", fullName: "Friday"},
        {shortName: "Sat", fullName: "Saturday"},
        {shortName: "Sun", fullName: "Funday"},
    ];

}

const UserLocaleContext = createContext(DefaultLocale)
const getUserLocale = () => useContext(UserLocaleContext)
function createUserLocaleProvider(locale: Locale, children: ReactNode[]) {
    // @ts-ignore
    return createElement(UserLocaleContext.Provider, {value: locale}, children)
}

export type {WeekDay, Month, Locale}
export {getUserLocale, createUserLocaleProvider}
