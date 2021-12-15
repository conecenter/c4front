import React, { useEffect, useRef } from "react";
import { useUserLocale } from "../locale";
import { addMonths, getDate as getDayOfMonth, getDaysInMonth, getWeek, isMonday, startOfWeek } from "date-fns";
import { getOrElse, isEmpty, nonEmpty, Option } from '../../main/option';
import { DateSettings, getDate } from "./date-utils";

interface calendarDate {
  year: number;
  month: number;
}

interface DatepickerCalendarProps {
  popupDate: calendarDate,
  currentDateOpt: Option<Date>,
  dateSettings: DateSettings,
  inputRef: React.MutableRefObject<HTMLInputElement | undefined>,
  onClickAway: () => void,
  onDateChoice: (e: React.MouseEvent) => void,
  onMonthArrowClick: (e: React.MouseEvent) => void,
  onTimeBtnClick: (e: React.MouseEvent) => void,
  onNowBtnClick: () => void
}

export function DatepickerCalendar({
                                    popupDate, 
                                    currentDateOpt, 
                                    dateSettings, 
                                    inputRef, 
                                    onClickAway, 
                                    onDateChoice, 
                                    onMonthArrowClick,
                                    onTimeBtnClick,
                                    onNowBtnClick
                                   }: DatepickerCalendarProps) {
  const { year, month } = popupDate;
  const pageDate = new Date(year, month);

  const dpCalendar = useRef<HTMLDivElement>(null);

  const locale = useUserLocale();

  const weeksToShow = 6;
  
  const daysPrevMonth = isMonday(pageDate) ? [] : calcDaysPrevMonth(pageDate, currentDateOpt, dateSettings);

  const daysCurrMonth = getSpanList(createArray(1, getDaysInMonth(pageDate)), popupDate, currentDateOpt, dateSettings);

  const numDaysNextMonth = weeksToShow * 7 - daysPrevMonth.length - daysCurrMonth.length;
  const nextMonth = addMonths(pageDate, 1);
  const daysNextMonth = getSpanList(
    createArray(1, numDaysNextMonth),
    { year: nextMonth.getFullYear(), month: nextMonth.getMonth() },
    currentDateOpt,
    dateSettings,
    'dayNextMonth'
  );

  const weekNumStart = getWeek(pageDate, { weekStartsOn: 1, firstWeekContainsDate: 4 });;
  const weekNumEnd = weekNumStart + weeksToShow - 1;
  const weekNumbersArr = (month === 0 && weekNumStart !== 1)
    ? [weekNumStart, ...createArray(1, 5)]
    : month === 11
      ? [...createArray(weekNumStart, weekNumEnd - 1), 1]
      : createArray(weekNumStart, weekNumEnd);
  const weekNumbers = weekNumbersArr.map(weekNum => getSpan(weekNum));

  const weekDays = locale.weekDays.map(({ shortName }) => getSpan(shortName));

  /*
   * Time (hours : minutes) part of calendar
  */

  const hoursTimeSection = getTimeSection('hours');
  const minsTimeSection = getTimeSection('minutes');

  const timeDisplay = (
    <div className='dpTimeContainer'>
      {hoursTimeSection}
      <span className='dpTimeSeparator'>:</span>
      {minsTimeSection}
    </div>
  );

  function getTimeSection(sectionUnit: 'hours' | 'minutes', btnClasses = ['dpTimeBtnUp', 'dpTimeBtnDown']) {
      const currValue = isEmpty(currentDateOpt) ? 0 : sectionUnit === 'hours' 
        ? currentDateOpt.getHours() : currentDateOpt.getMinutes();
      const changeValue = sectionUnit === 'hours' ? '3600' : '60';
    return (
      <div className='dpTimeSection'>
        <span>{currValue.toString().padStart(2, '0')}</span>
        <div className='dpTimeBtnsContainer'>
          {btnClasses.map(className => <button 
            key={className}
            className={className} 
            data-change={className === 'dpTimeBtnUp' ? changeValue : -changeValue} 
            onClick={onTimeBtnClick} />)}
        </div>
      </div>
    );
  }

  /*
   * Вариант onClickAway с колбэком в useRef и однократной привязкой листенера

  const savedCallback = useRef();

  useEffect(() => {
    function callback (e: MouseEvent) {
      if (dpCalendar.current 
        && !dpCalendar.current.contains(e.target as Node) 
        && e.target !== inputRef.current) onClickAway();
    }
    savedCallback.current = callback;
  });
  
  useEffect(() => {
    function handleClick (e: MouseEvent) {
      savedCallback.current(e);
    }
    const doc = dpCalendar.current!.ownerDocument;
    doc.addEventListener('click', handleClick);
    return () => {
      console.log('removeListener');
      doc.removeEventListener('click', handleClick);
    }
  }, []);

  */
  
  useEffect(() => {
    function handleClick (e: MouseEvent) {
      if (dpCalendar.current 
        && !dpCalendar.current.contains(e.target as Node) 
        && e.target !== inputRef.current) onClickAway();
    }
    const doc = dpCalendar.current!.ownerDocument;
    doc.addEventListener('click', handleClick);
    return () => doc.removeEventListener('click', handleClick);
  }, [onClickAway]);
  
  return (
    <div ref={dpCalendar} className='dpCalendar'>
      <div className='dpCalendarHeader'>
        <button data-change='-1' onClick={onMonthArrowClick}>{'<'}</button>
        <h2>
          <select defaultValue={month} key={month}>
            {locale.months.map(monthName => 
              <option key={`month-${monthName.id}`} value={monthName.id}>{monthName.fullName}</option>
            )}
          </select>
          {year}
        </h2>
        <button data-change='1' onClick={onMonthArrowClick}>{'>'}</button>
      </div>

      <div className='dpCalendarContainer'>
        <div className='dpCalendarWeekDays'>
          {weekDays}
        </div>
        <div className='dpCalendarWeekNums'>
          {weekNumbers}
        </div>
        <div className='dpCalendarDays' onClick={onDateChoice}>
          {daysPrevMonth}
          {daysCurrMonth}
          {daysNextMonth}
        </div>
      </div>

      {dateSettings.timestampFormat.hasTime && timeDisplay}

      <div className='dpCtrlBtnsCont'>
        <button className='dpBtnNow' onClick={onNowBtnClick}>Now</button>
        <button className='dpBtnClear'>Clear</button>
      </div>
    </div>
  );
}

function createArray(start: number, end: number) {
  return Array.from({length: end - start + 1}, (_, i) => i + start);
}

function getSpan(value: number | string, className?: string, dataset?: string) {
  return <span className={className || undefined} data-date={dataset} key={dataset || value} >{value}</span>;
};

function getSpanList(
                      array: number[], 
                      dataset: calendarDate, 
                      currentDate: Option<Date>, 
                      dateSettings: DateSettings, 
                      className?: string
                    ) {
  const currDate = getOrElse(currentDate, getDate(Date.now(), dateSettings));
  const currDateString = nonEmpty(currDate) 
    ? `${currDate.getDate()}-${currDate.getMonth()}-${currDate.getFullYear()}` : '';
  return array.map(number => {
    const datasetDate = `${number}-${dataset.month}-${dataset.year}`;
    const classString = `${className || ''} ${datasetDate === currDateString ? 'today' : ''}`.trim();
    return getSpan(number, classString, datasetDate);
  });
}

function calcDaysPrevMonth(pageDate: Date, currentDateOpt: Option<Date>, dateSettings: DateSettings) {
  const firstWeekStart = startOfWeek(pageDate, { weekStartsOn: 1 });
  const startIndex = getDayOfMonth(firstWeekStart);
  const endIndex = getDaysInMonth(firstWeekStart);
  return getSpanList(
    createArray(startIndex, endIndex),
    { year: firstWeekStart.getFullYear(), month: firstWeekStart.getMonth() },
    currentDateOpt,
    dateSettings,
    'dayPrevMonth'
  );
}