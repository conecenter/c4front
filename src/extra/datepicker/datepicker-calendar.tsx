import React, { useEffect, useRef, useState } from "react";
import { useUserLocale } from "../locale";
import { addMonths, getDate as getDayOfMonth, getDaysInMonth, getWeek, isMonday, startOfWeek } from "date-fns";
import { getOrElse, isEmpty, nonEmpty, Option } from '../../main/option';
import { adjustDate, DateSettings, getDate, getTimestamp } from "./date-utils";
import { usePopupPos } from "../../main/popup";
import { getOnMonthChoice, getOnMonthPopupMiss, getOnToggleMonthPopup } from "./datepicker-actions";
import { createTimestampState, DatePickerState } from "./datepicker-exchange";

interface CalendarDate {
  year: number;
  month: number;
}

interface DatepickerCalendarProps {
  currentState: DatePickerState,
  currentDateOpt: Option<Date>,
  dateSettings: DateSettings,
  inputRef: React.MutableRefObject<HTMLInputElement | undefined>,
  onClickAway: () => void,
  onDateChoice: (e: React.MouseEvent) => void,
  onMonthArrowClick: (e: React.MouseEvent) => void,
  onNowBtnClick: () => void,
  onClearBtnClick: () => void
}

export function DatepickerCalendar({
                                    currentState,
                                    setFinalState,
                                    fieldEl,
                                    currentDateOpt, 
                                    dateSettings, 
                                    inputRef, 
                                    onClickAway, 
                                    onDateChoice, 
                                    onMonthArrowClick,
                                    onNowBtnClick,
                                    onClearBtnClick
                                   }: DatepickerCalendarProps) {
  const popupDate = currentState.popupDate as CalendarDate;
  const { year, month } = popupDate;

  const pageDate = new Date(year, month);

  //const dpCalendar = useRef<HTMLDivElement>(null);

  const [popupElement,setPopupElement] = useState(null);
  const [pos] = usePopupPos(popupElement);
  
  const locale = useUserLocale();

  const weeksToShow = 6;

 /*
   * Months section functionality
  */ 

  const currMonthObj = locale.months.find(monthName => monthName.id === month);
  const currMonthName = currMonthObj ? currMonthObj.fullName : null;

  const [monthPopupShow, setMonthPopupShow] = useState(false);

  const [popupMonth,setpopupMonth] = useState(null);

  const [popupMonthPos] = usePopupPos(popupMonth);

  const onToggleMonthPopup = getOnToggleMonthPopup(setMonthPopupShow);
  const onMonthPopupMiss = getOnMonthPopupMiss(popupMonth, setMonthPopupShow);
  const onMonthChoice = getOnMonthChoice(currentState, setFinalState, setMonthPopupShow);
  
  // refactor with getSpan ?
  const monthPopup = (
    <div ref={setpopupMonth} style={popupMonthPos} className='dpCalendarMonthPopup'>
      {locale.months.map(month => 
        <span key={month.fullName} onClick={onMonthChoice} data-month={month.id}>{month.fullName}</span>
      )}
    </div>
  );

  /*
   * Years section functionality
  */ 

  const yearsArrowBtnsDiv = getArrowBtnsDiv(changeCalendarYear);

  function changeCalendarYear(e: React.MouseEvent<HTMLButtonElement>) {
    const change = e.currentTarget.dataset.change;
    if (!change) return;
    const newPopupDate = { month, year: year + +change };
    setFinalState({...currentState, popupDate: newPopupDate });
  }

  /*
   * 
  */ 

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
   * Time section functionality
  */

  const hoursTimeSection = getTimeSection('H');
  const minsTimeSection = getTimeSection('m');

  function getTimeSection(symbol: 'H' | 'm') {
    const currValue = isEmpty(currentDateOpt) ? 0 : symbol === 'H' 
      ? currentDateOpt.getHours() : currentDateOpt.getMinutes();
    return (
      <div className='dpTimeSection'>
        <span>{currValue.toString().padStart(2, '0')}</span>
        {getArrowBtnsDiv(getOnTimeBtnClick(symbol))}
      </div>
    );
  }

  function getOnTimeBtnClick(symbol: 'H' | 'm') {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      if (e.currentTarget.dataset.change) {
          const adjustedDate = adjustDate(currentDateOpt as Date, symbol, +e.currentTarget.dataset.change, true);
          setFinalState(createTimestampState(getTimestamp(adjustedDate, dateSettings)));
      }
    }
  }

  const timeDisplay = (
    <div className='dpTimeContainer'>
      {hoursTimeSection}
      <span className='dpTimeSeparator'>:</span>
      {minsTimeSection}
    </div>
  );

  /*
   * onClickAway с колбэком в useRef и однократной привязкой листенера к document
  */

  const savedCallback = useRef() as React.MutableRefObject<Function>;
  
  // Add ids list of exceptions or inputref?? Separate into reusable custom hook??
  useEffect(() => {
    function callback (e: MouseEvent) {
      if (popupElement && !popupElement.contains(e.target as Node) && !fieldEl.contains(e.target)) onClickAway();
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
    <div ref={setPopupElement} style={pos} onClick={monthPopupShow? onMonthPopupMiss : undefined} className='dpCalendar'>
      <div className='dpCalendarHeader'>
        <button data-change='-1' onClick={onMonthArrowClick}>{'<'}</button>
        <div className="dpCalendarMonthYear">
          <button id='btnDpMonthPopup' className='dpCalendarCurrMonth' onClick={onToggleMonthPopup}>{currMonthName}</button>
          <div className="dpCalendarYears">
            <span>{year}</span>
            {yearsArrowBtnsDiv}
          </div>
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

function getArrowBtnsDiv(callback: React.MouseEventHandler) {
  const arrowBtnClasses = ['dpArrowBtnUp', 'dpArrowBtnDown'];
  return (
      <div className='dpArrowBtnsCont'>
        {arrowBtnClasses.map(className => <button 
          key={className}
          className={className} 
          data-change={className === 'dpArrowBtnUp' ? 1 : -1} 
          onClick={callback} />)}
      </div>
  );
}

function createArray(start: number, end: number) {
  return Array.from({length: end - start + 1}, (_, i) => i + start);
}

function getSpan(value: number | string, className?: string, dataset?: string) {
  return <span className={className || undefined} data-date={dataset} key={dataset || value} >{value}</span>;
};

// Move inside and useCallback?
function getSpanList(
                      array: number[], 
                      dataset: CalendarDate, 
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

// Move inside and useCallback?
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