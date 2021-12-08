import React, { useEffect, useRef } from "react";
import { useUserLocale } from "../locale";
import { addMonths, getDate, getDaysInMonth, getWeek, isMonday, format, startOfWeek } from "date-fns";
import { DatePickerState, PopupDate } from "./datepicker-exchange";
import { onDateChoiceAction } from './datepicker-actions';
import { getOrElse, Option } from '../../main/option';

interface DatepickerCalendarProps {
  popupDate: { year: number, month: number },
  currentDateOpt: Option<Date>,
  onClickAway: () => void,
  onDateChoice: (state: DatePickerState) => void
}

export function DatepickerCalendar({ popupDate, currentDateOpt, onClickAway, onDateChoice: setFinalState }: DatepickerCalendarProps) {
  const { year, month } = popupDate;
  const pageDate = new Date(year, month);

  const dpCalendar = useRef<HTMLDivElement>(null);

  const locale = useUserLocale();

  const weeksToShow = 6;
  
  const daysPrevMonth = isMonday(pageDate) ? [] : calcDaysPrevMonth(pageDate);

  const daysCurrMonth = getSpanList(createArray(1, getDaysInMonth(pageDate)), 'curr', { year, month });

  const numDaysNextMonth = weeksToShow * 7 - daysPrevMonth.length - daysCurrMonth.length;
  const nextMonth = addMonths(pageDate, 1);
  const daysNextMonth = getSpanList(
    createArray(1, numDaysNextMonth), 
    'next', 
    { year: nextMonth.getFullYear(), month: nextMonth.getMonth() },
    'dayNextMonth'
  );

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

  useEffect(() => {
    const dateString = format(getOrElse(currentDateOpt, new Date()), 'd-M-yyyy');
    const today = dpCalendar.current!.querySelector(`[data-date='${dateString}']`);
    if (today) today.classList.add('today');
  });
  
  useEffect(() => {
    function handleClick (e: MouseEvent) {
      if (dpCalendar.current && !dpCalendar.current.contains(e.target as Node)) onClickAway();
      else if (e.target instanceof HTMLSpanElement && e.target.dataset.date) 
        onDateChoiceAction(e.target.dataset.date, setFinalState);
    }
    const doc = dpCalendar.current!.ownerDocument;
    doc.addEventListener('click', handleClick);
    return () => doc.removeEventListener('click', handleClick);
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

function getSpanList(array: number[], keyPrefix: string, dataset?: PopupDate, className?: string) {
  return array.map(number => 
    <span 
      className={className} 
      data-date={dataset? `${number}-${dataset.month + 1}-${dataset.year}` : ''} 
      key={`${keyPrefix}${number}`}>
        {number}
    </span>);
}

function calcDaysPrevMonth(pageDate: Date) {
  const firstWeekStart = startOfWeek(pageDate, { weekStartsOn: 1 });
  const startIndex = getDate(firstWeekStart);
  const endIndex = getDaysInMonth(firstWeekStart);
  return getSpanList(
    createArray(startIndex, endIndex), 
    'prev', 
    { year: firstWeekStart.getFullYear(), month: firstWeekStart.getMonth() }, 
    'dayPrevMonth'
  );
}