import React, { useEffect, useRef, useState } from "react";
import { useUserLocale } from "../locale";
import { addMonths, getDate as getDayOfMonth, getDaysInMonth, getWeek, isMonday, startOfWeek } from "date-fns";
import { getOrElse, isEmpty, nonEmpty, Option } from '../../main/option';
import { DateSettings, getDate } from "./date-utils";
import { usePopupPos } from "../../main/popup";
import { getOnMonthChoice, getOnToggleMonthPopup } from "./datepicker-actions";

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
  onNowBtnClick: () => void,
  onClearBtnClick: () => void
}

export function DatepickerCalendar({
                                    currentState,
                                    setFinalState,
                                    fieldEl,
                                    popupDate, 
                                    currentDateOpt, 
                                    dateSettings, 
                                    inputRef, 
                                    onClickAway, 
                                    onDateChoice, 
                                    onMonthArrowClick,
                                    onTimeBtnClick,
                                    onNowBtnClick,
                                    onClearBtnClick
                                   }: DatepickerCalendarProps) {
  const { year, month } = popupDate;
  const pageDate = new Date(year, month);

  //const dpCalendar = useRef<HTMLDivElement>(null);

  const [popupElement,setPopupElement] = useState(null);
  const [pos] = usePopupPos(popupElement);
  
  const locale = useUserLocale();

  const weeksToShow = 6;

  /*
   * Months selection functionality
  */

  const currMonthObj = locale.months.find(monthName => monthName.id === month);
  const currMonthName = currMonthObj ? currMonthObj.fullName : null;

  const [monthPopupShow, setMonthPopupShow] = useState(false);

  const [popupMonth,setpopupMonth] = useState(null);
  const [popupMonthPos] = usePopupPos(popupMonth);

  const onToggleMonthPopup = getOnToggleMonthPopup(setMonthPopupShow);
  const onMonthChoice = getOnMonthChoice(currentState, setFinalState, setMonthPopupShow);
  
  // refactor with getSpan ?
  const monthPopup = (
    <div ref={setpopupMonth} style={popupMonthPos} className='dpCalendarMonthPopup'>
      {locale.months.map(month => 
        <span key={month.fullName} onClick={onMonthChoice} data-month={month.id}>{month.fullName}</span>
      )}
    </div>
  );

  
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
   * onClickAway с колбэком в useRef и однократной привязкой листенера к document
  */

  const savedCallback = useRef() as React.MutableRefObject<Function>;
  
  useEffect(() => {
    function callback (e: MouseEvent) {
      if (popupElement && !popupElement.contains(e.target as Node) && !fieldEl.contains(e.target)) {
        console.log('closing Popup', popupElement.contains(e.target))
        onClickAway();
      }
      else if (popupMonth && !popupMonth.contains(e.target as Node) && e.target.id !== 'btnDpMonthPopup') setMonthPopupShow(false);
    }
    savedCallback.current = callback;
  }, [onClickAway, popupElement, fieldEl, popupMonth]);
  
  useEffect(() => {
    if(!popupElement) return;
    const handleClick = (e: MouseEvent) => savedCallback.current(e);
    const doc = popupElement.ownerDocument;
    doc.addEventListener('mousedown', handleClick);
    return () => doc.removeEventListener('mousedown', handleClick);
  }, [popupElement]);

  /*
   * Вариант onClickAway c перепривязкой листенера при каждом ререндере

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

  */

console.log('render Calendar');

  return (
    <div ref={setPopupElement} style={pos} className='dpCalendar'>
      <div className='dpCalendarHeader'>
        <button data-change='-1' onClick={onMonthArrowClick}>{'<'}</button>
        <div className="dpCalendarMonthYear">
          <button id='btnDpMonthPopup' className='dpCalendarCurrMonth' onClick={onToggleMonthPopup}>{currMonthName}</button>
          <span>{year}</span>
          {monthPopupShow && monthPopup}
        </div>
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
        <button className='dpBtnClear' onClick={onClearBtnClick}>Clear</button>
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