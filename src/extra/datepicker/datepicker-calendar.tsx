import React from "react";
import { useUserLocale } from "../locale";
import { endOfYear, getDate, getDaysInMonth, getWeek, isMonday, startOfWeek } from "date-fns";
import { subWeeks } from "date-fns/esm";
import { PopupDate } from "./datepicker";

interface DatepickerCalendarProps {
  popupDate: { year: number, month: number }
}

export function DatepickerCalendar({ popupDate }: DatepickerCalendarProps) {
  const { year, month } = popupDate;

  const pageDate = new Date(year, month);
  const weeksToShow = 6;

  const locale = useUserLocale();
  const pageMonth = locale.getMonthNameFull(month);

  let fromDatePrevMonth: Date;
  let startIndex: number, endIndex: number;
  
  if (isMonday(pageDate)) {
    fromDatePrevMonth = subWeeks(pageDate, 1);
    startIndex = getDate(fromDatePrevMonth);
    endIndex = startIndex + 6;
  } else {
    fromDatePrevMonth = startOfWeek(pageDate, { weekStartsOn: 1 });
    startIndex = getDate(fromDatePrevMonth);
    endIndex = getDaysInMonth(fromDatePrevMonth);
  }
  const daysPrevMonth = getSpanList(createArray(startIndex, endIndex), 'prev', 'dayPrevMonth');

  const daysCurrMonth = getSpanList(createArray(1, getDaysInMonth(pageDate)), 'curr');

  const numDaysNextMonth = weeksToShow * 7 - daysPrevMonth.length - daysCurrMonth.length;
  const daysNextMonth = getSpanList(createArray(1, numDaysNextMonth), 'next', 'dayNextMonth');  

  const weekNumStart = getWeek(fromDatePrevMonth, { weekStartsOn: 1, firstWeekContainsDate: 4 });
  const weekNumEnd = weekNumStart + weeksToShow - 1;

  const weekNumbersArr = (month === 0 && weekNumStart !== 1)
    ? [weekNumStart, ...createArray(1, 5)]
    : month === 11
      ? [...createArray(weekNumStart, weekNumEnd - 1), 1]
      : createArray(weekNumStart, weekNumEnd);
  const weekNumbers = getSpanList(weekNumbersArr, 'week');

  const weekDays = locale.weekDays
    .map(({ shortName }) => <span key={`${shortName}`}>{shortName}</span>);

  return (
    <div className='dpCalendar'>
      <h2>{pageMonth} {year}</h2>
      <div className='dpCalendarContainer'>
        <div className='dpCalendarWeekDays'>
          {weekDays}
        </div>
        <div className='dpCalendarWeekNums'>
          {weekNumbers}
        </div>
        <div className='dpCalendarDays'>
          {daysPrevMonth}
          {daysCurrMonth}
          {daysNextMonth}
        </div>
      </div>
    </div>
  );
}

function createArray(start: number, end: number) {
  return Array.from({length: end - start + 1}, (_, i) => i + start);
}

function getSpanList(array: number[], keyPrefix: string, className?: string) {
  return array.map(number => <span className={className} key={`${keyPrefix}${number}`}>{number}</span>);
}