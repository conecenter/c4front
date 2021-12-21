import React, { useEffect, useRef, useState } from "react";
import { useUserLocale } from "../locale";
import { addMonths, getDate as getDayOfMonth, getDaysInMonth, getWeek, isMonday, set, startOfWeek } from "date-fns";
import { getOrElse, isEmpty, None, nonEmpty, Option } from '../../main/option';
import { adjustDate, DateSettings, getDate, getTimestamp } from "./date-utils";
import { usePopupPos } from "../../main/popup";
import { createTimestampState, DatePickerState } from "./datepicker-exchange";

interface CalendarDate {
  year: number;
  month: number;
}

interface DatepickerCalendarProps {
  currentState: DatePickerState,
  currentDateOpt: Option<Date>,
  dateSettings: DateSettings,
  setFinalState: (state: DatePickerState) => void,
  inputRef: React.MutableRefObject<HTMLInputElement | undefined>,
  inputBoxRef: React.MutableRefObject<HTMLDivElement | undefined>
}

export function DatepickerCalendar({
  currentState,
  currentDateOpt,
  dateSettings,
  setFinalState,
  inputRef,
  inputBoxRef
}: DatepickerCalendarProps) {

  const popupDate = currentState.popupDate as CalendarDate;
  const { year, month } = popupDate;

  const pageDate = new Date(year, month);

  const locale = useUserLocale();

  const weeksToShow = 6;

  /*
   * Popup elements positioning
  */ 

  const [popupCalendarRef,setPopupCalendarRef] = useState<HTMLDivElement | null>(null);
  const [popupCalendarPos] = usePopupPos(popupCalendarRef);

  const [popupMonthRef,setPopupMonthRef] = useState<HTMLDivElement | null>(null);
  const [popupMonthPos] = usePopupPos(popupMonthRef);

  /*
   * Months section functionality
  */ 

  const currMonthObj = locale.months.find(monthName => monthName.id === month);
  const currMonthName = currMonthObj ? currMonthObj.fullName : null;

  function onMonthArrowClick(e: React.MouseEvent<HTMLButtonElement>) {
    const change = e.currentTarget.dataset.change;
    if (change) {
      const newDate = addMonths(new Date(year, month), +change);
      setFinalState({...currentState, popupDate: { year: newDate.getFullYear(), month: newDate.getMonth() }});
    }
  }

  const [popupMonthShow, setPopupMonthShow] = useState(false);

  const onToggleMonthPopup = () => setPopupMonthShow(prevMonthPopup => !prevMonthPopup);

  const onMonthPopupMiss = () => setPopupMonthShow(false);

  function onMonthChoice(e: React.MouseEvent<HTMLButtonElement>) {
    const newMonth = e.currentTarget.dataset.month;
    if (newMonth) setFinalState({ ...currentState, popupDate: { year, month: +newMonth } });
  }

  /*
   * Years section functionality
  */

  const yearsArrowBtnsDiv = getArrowBtnsDiv(onCalendarYearChange);

  function onCalendarYearChange(e: React.MouseEvent<HTMLButtonElement>) {
    const change = e.currentTarget.dataset.change;
    if (change) setFinalState({...currentState, popupDate: { month, year: year + +change } });
  }

  /*
   * Calendar days section functionality
  */ 

  function getSpanList(array: number[], dataset: CalendarDate, className?: string) {
    const getDateString = (date: Option<Date>) => nonEmpty(date) 
      ? `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}` : '';
    const today = getDate(Date.now(), dateSettings);
    const todayString = getDateString(today);
    const currDateString = getDateString(getOrElse(currentDateOpt, today));
    return array.map(number => {
      const datasetDate = `${number}-${dataset.month}-${dataset.year}`;
      const isCurrent = datasetDate === currDateString;
      const isToday = datasetDate === todayString;
      const classString = `${className || ''} ${isCurrent ? 'current' : ''} ${isToday ? 'today' : ''}`.trim();
      return getSpan(number, classString, datasetDate);
    });
  }

  const daysPrevMonth = isMonday(pageDate) ? [] : calcDaysPrevMonth();
  function calcDaysPrevMonth() {
    const firstWeekStart = startOfWeek(pageDate, { weekStartsOn: 1 });
    const startIndex = getDayOfMonth(firstWeekStart);
    const endIndex = getDaysInMonth(firstWeekStart);
    return getSpanList(
      createArray(startIndex, endIndex),
      { year: firstWeekStart.getFullYear(), month: firstWeekStart.getMonth() },
      'dayPrevMonth'
    );
  }

  const daysCurrMonth = getSpanList(createArray(1, getDaysInMonth(pageDate)), popupDate);

  const numDaysNextMonth = weeksToShow * 7 - daysPrevMonth.length - daysCurrMonth.length;
  const nextMonth = addMonths(pageDate, 1);
  const daysNextMonth = getSpanList(
    createArray(1, numDaysNextMonth), 
    { year: nextMonth.getFullYear(), month: nextMonth.getMonth() },
    'dayNextMonth'
  );

  function onDateChoice(e: React.MouseEvent) {
    if (!(e.target instanceof HTMLSpanElement && e.target.dataset.date)) return;
    const dateValues = e.target.dataset.date.split('-');
    const isDateAvailable = nonEmpty(currentDateOpt);
    const baseDate = isDateAvailable ? currentDateOpt : getDate(Date.now(), dateSettings);
    if (isEmpty(baseDate)) return;
    const timeSettings = isDateAvailable ? {} : { hours: 0, minutes: 0, seconds: 0 };
    const chosenDate = set(baseDate, {
        year: +dateValues[2],
        month: +dateValues[1],
        date: +dateValues[0],
        ...timeSettings
    });
    setFinalState(createTimestampState(getTimestamp(chosenDate, dateSettings), None));
  }

  /*
   * Calendar weeks section functionality
  */ 

  const weekNumStart = getWeek(pageDate, { weekStartsOn: 1, firstWeekContainsDate: 4 });
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
   * Now & Close buttons functionality
  */

  const onNowBtnClick = () => setFinalState(createTimestampState(Date.now(), None));

  function onCloseBtnClick() {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(100, 100);
    }
    setFinalState({ ...currentState, popupDate: None });
  }

  /*
   * Closing popup calendar on click outside functionality
  */

  const savedCallback = useRef() as React.MutableRefObject<Function>;
  
  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      const target = e.target as Node;
      if ((popupCalendarRef && popupCalendarRef.contains(target)) 
        || (inputBoxRef.current && inputBoxRef.current.contains(target))) return;
      setFinalState({ ...currentState, popupDate: None });
    }
    savedCallback.current = onClickAway;
  });
  
  useEffect(() => {
    if(!popupCalendarRef) return;
    const handleClick = (e: MouseEvent) => savedCallback.current(e);
    const doc = popupCalendarRef.ownerDocument;
    doc.addEventListener('mousedown', handleClick);
    return () => doc.removeEventListener('mousedown', handleClick);
  }, [popupCalendarRef]);

  console.log('render Calendar');

  return (
    <div ref={setPopupCalendarRef} 
         style={popupCalendarPos}
         className='dpCalendar'
         onClick={popupMonthShow ?  onMonthPopupMiss : undefined} >
      <div className='dpCalendarHeader'>
        <button data-change='-1' onClick={onMonthArrowClick}>{'<'}</button>
        <div className="dpCalendarMonthYear">
          <button className='dpCalendarCurrMonth' onClick={onToggleMonthPopup}>{currMonthName}</button>
          <div className="dpCalendarYears">
            <span>{year}</span>
            {yearsArrowBtnsDiv}
          </div>
          {popupMonthShow &&
            <div ref={setPopupMonthRef} style={popupMonthPos} className='dpCalendarMonthPopup'>
              {locale.months.map(month => 
                <span key={month.fullName} onClick={onMonthChoice} data-month={month.id}>{month.fullName}</span>
              )}
            </div>
          }
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
        <button className='dpBtnClose' onClick={onCloseBtnClick}>Close</button>
      </div>
    </div>
  );
}

function getArrowBtnsDiv(callback: React.MouseEventHandler) {
  const arrowBtnClasses = ['dpArrowBtnUp', 'dpArrowBtnDown'];
  return (
      <div className='dpArrowBtnsCont'>
        {arrowBtnClasses.map(className => 
          <button 
            key={className}
            className={className} 
            data-change={className === 'dpArrowBtnUp' ? 1 : -1} 
            onClick={callback} />) }
      </div>
  );
}

function createArray(start: number, end: number) {
  return Array.from({length: end - start + 1}, (_, i) => i + start);
}

function getSpan(value: number | string, className?: string, dataset?: string) {
  return <span className={className || undefined} data-date={dataset} key={dataset || value} >{value}</span>;
};