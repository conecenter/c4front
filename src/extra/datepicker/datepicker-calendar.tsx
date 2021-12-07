import React, { useEffect, useRef } from "react";
import { useUserLocale } from "../locale";
import { getDate, getDaysInMonth, getWeek, isMonday, startOfWeek } from "date-fns";
import { useEventListener } from '../../main/vdom-hooks'

interface DatepickerCalendarProps {
  popupDate: { year: number, month: number },
  onClickAway: () => void
}

export function DatepickerCalendar({ popupDate, onClickAway }: DatepickerCalendarProps) {
  const { year, month } = popupDate;

  const pageDate = new Date(year, month);
  const weeksToShow = 6;

  const locale = useUserLocale();
  const pageMonth = locale.getMonthNameFull(month);
  
  const daysPrevMonth = isMonday(pageDate) ? [] : calcDaysPrevMonth(pageDate);

  const daysCurrMonth = getSpanList(createArray(1, getDaysInMonth(pageDate)), 'curr');

  const numDaysNextMonth = weeksToShow * 7 - daysPrevMonth.length - daysCurrMonth.length;
  const daysNextMonth = getSpanList(createArray(1, numDaysNextMonth), 'next', 'dayNextMonth');  

  const weekNumStart = getWeek(pageDate, { weekStartsOn: 1, firstWeekContainsDate: 4 });
  const weekNumEnd = weekNumStart + weeksToShow - 1;

  const weekNumbersArr = (month === 0 && weekNumStart !== 1)
    ? [weekNumStart, ...createArray(1, 5)]
    : month === 11
      ? [...createArray(weekNumStart, weekNumEnd - 1), 1]
      : createArray(weekNumStart, weekNumEnd);
  const weekNumbers = getSpanList(weekNumbersArr, 'week');

  const weekDays = locale.weekDays
    .map(({ shortName }) => <span key={`${shortName}`}>{shortName}</span>);

  const dpCalendar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick (e: MouseEvent) {
      if (dpCalendar.current && !dpCalendar.current.contains(e.target as Node)) onClickAway();
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div ref={dpCalendar} className='dpCalendar'>
      <h2>
        <select defaultValue={month}>
          {locale.months.map(monthName => 
            <option key={`month-${monthName.id}`} value={monthName.id}>{monthName.fullName}</option>
          )}
        </select>
        {year}
      </h2>
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

function calcDaysPrevMonth(pageDate: Date) {
  const firstWeekStart = startOfWeek(pageDate, { weekStartsOn: 1 });
  const startIndex = getDate(firstWeekStart);
  const endIndex = getDaysInMonth(firstWeekStart);
  return getSpanList(createArray(startIndex, endIndex), 'prev', 'dayPrevMonth');
}