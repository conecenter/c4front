import React, { useState } from "react";
import { useUserLocale } from "../locale";
import { addMonths, getDate as getDayOfMonth, getDaysInMonth, getWeek, isMonday, set, startOfWeek } from "date-fns";
import { isEmpty, nonEmpty, Option, toOption } from '../../main/option';
import { adjustDate, DateSettings, getDate, getTimestamp, getPopupDate } from "./date-utils";
import { usePopupPos } from "../../main/popup";
import { createPopupChange, createTimestampChange, DatepickerChange, DatePickerState, PopupDate } from "./datepicker-exchange";
import { findFirstParent } from '../../main/vdom-util';

interface DatepickerCalendarProps {
  currentState: DatePickerState,
  currentDateOpt: Option<Date>,
  dateSettings: DateSettings,
  sendFinalChange: (ch: DatepickerChange, force?: boolean) => void,
  sendTempChange: (ch: DatepickerChange) => void,
  inputRef: React.MutableRefObject<HTMLInputElement | null>
}

const WEEKS_TO_SHOW = 6;

export function DatepickerCalendar({
  currentState,
  currentDateOpt,
  dateSettings,
  sendFinalChange,
  sendTempChange,
  inputRef
}: DatepickerCalendarProps) {

  const popupDate = currentState.popupDate as PopupDate;
  const { year, month } = popupDate;

  const pageDate = new Date(year, month);

  const locale = useUserLocale();

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
      const newDate = addMonths(new Date(year, month), Number(change));
      sendTempChange(createPopupChange(getPopupDate(newDate)));
    }
  }

  const [popupMonthShow, setPopupMonthShow] = useState(false);

  const onToggleMonthPopup = () => setPopupMonthShow(prevMonthPopup => !prevMonthPopup);

  const onMonthPopupMiss = () => setPopupMonthShow(false);

  function onMonthChoice(e: React.MouseEvent<HTMLButtonElement>) {
    const newMonth = e.currentTarget.dataset.month;
    if (newMonth) sendTempChange(createPopupChange({ year, month: Number(newMonth) }));
  }

  /*
   * Years section functionality
  */
  const yearsArrowBtnsDiv = getArrowBtnsDiv(onCalendarYearChange);

  function onCalendarYearChange(e: React.MouseEvent<HTMLButtonElement>) {
    const change = e.currentTarget.dataset.change;
    if (change) sendTempChange(createPopupChange({ month, year: year + Number(change) }));
  }

  /*
   * Calendar days section functionality
  */
  const daysPrevMonth = isMonday(pageDate) ? [] : calcDaysPrevMonth();
  function calcDaysPrevMonth() {
    const firstWeekStart = startOfWeek(pageDate, { weekStartsOn: 1 });
    const startIndex = getDayOfMonth(firstWeekStart);
    const endIndex = getDaysInMonth(firstWeekStart);
    return getSpanList(
      createArray(startIndex, endIndex),
      getPopupDate(firstWeekStart),
      dateSettings,
      currentDateOpt,
      'dayPrevMonth'
    );
  }

  const daysCurrMonth = getSpanList(createArray(1, getDaysInMonth(pageDate)), popupDate, dateSettings, currentDateOpt);

  const numDaysNextMonth = WEEKS_TO_SHOW * 7 - daysPrevMonth.length - daysCurrMonth.length;
  const nextMonth = addMonths(pageDate, 1);
  const daysNextMonth = getSpanList(
    createArray(1, numDaysNextMonth), 
    getPopupDate(nextMonth),
    dateSettings,
    currentDateOpt,
    'dayNextMonth'
  );

  const closePopup = () => sendTempChange(createPopupChange(null)); 

  function onDateChoice(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.dataset.date) return;
    const dateValues = target.dataset.date.split('-');
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
    focusActiveWrapper(popupCalendarRef);
    closePopup();
    sendFinalChange(createTimestampChange(getTimestamp(chosenDate, dateSettings)), true);
  }

  /*
   * Calendar weeks section functionality
  */
  const weekNumStart = getWeek(pageDate, { weekStartsOn: 1, firstWeekContainsDate: 4 });
  const weekNumEnd = weekNumStart + WEEKS_TO_SHOW - 1;
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
  const secondsTimeSection = getTimeSection('s');

  function getTimeSection(symbol: 'H' | 'm' | 's') {
    const currValue = isEmpty(currentDateOpt) ? 0
      : symbol === 'H' ? currentDateOpt.getHours()
      : symbol === 'm' ? currentDateOpt.getMinutes()
      : currentDateOpt.getSeconds();
    return (
      <div className='dpTimeSection'>
        <span>{currValue.toString().padStart(2, '0')}</span>
        {getArrowBtnsDiv(getOnTimeBtnClick(symbol))}
      </div>
    );
  }

  function getOnTimeBtnClick(symbol: 'H' | 'm' | 's') {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.dataset.change) return;
      if (nonEmpty(currentDateOpt)) {
          const adjustedDate = adjustDate(currentDateOpt, symbol, +e.currentTarget.dataset.change, true);
          sendTempChange(createTimestampChange(getTimestamp(adjustedDate, dateSettings)));
      } 
      else sendTempChange(createTimestampChange(Date.now()));
    }
  }

  /*
   * Now & Close buttons functionality
  */
  const onNowBtnClick = () => {
    focusActiveWrapper(popupCalendarRef);
    closePopup();
    sendFinalChange(createTimestampChange(Date.now()), true);
  }

  function onCloseBtnClick() {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(100, 100);
    }
    closePopup();
  }

  return (
    <div ref={setPopupCalendarRef} 
         style={{ ...popupCalendarPos, minWidth: 'auto' }}
         className='dpCalendar popupEl'
         tabIndex={-1}
         onClick={popupMonthShow ?  onMonthPopupMiss : undefined} >

      <div className='dpCalendarHeader'>
        <button data-change='-1' onClick={onMonthArrowClick} />

        <div className="dpCalendarMonthYear">
          <div className='dpCalendarMonth'>
            <button 
              type='button'
              className={popupMonthShow ? 'rotateArrow' : undefined} 
              onClick={onToggleMonthPopup}>
                {currMonthName} 
            </button>

            {popupMonthShow &&
              <div ref={setPopupMonthRef} style={popupMonthPos} className='popupEl'>
                {locale.months.map(month => 
                  <span key={month.fullName} onClick={onMonthChoice} data-month={month.id}>{month.fullName}</span>
                )}
              </div>}
          </div>

          <div className="dpCalendarYears">
            <span>{year}</span>
            {yearsArrowBtnsDiv}
          </div>
        </div>
        <button className='dpArrowRight' data-change='1' onClick={onMonthArrowClick} />
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

      {dateSettings.timestampFormat.hasTime && 
        <div className='dpTimeContainer'>
          {hoursTimeSection}
          <span className='dpTimeSeparator'>:</span>
          {minsTimeSection}
          {dateSettings.timestampFormat.has('s') &&
            <>
              <span className='dpTimeSeparator'>:</span>
              {secondsTimeSection}
            </>}
        </div>}

      <div className='dpCtrlBtnsCont'>
        <button className='dpBtnNow' onClick={onNowBtnClick}>{locale.btnNowText}</button>
        <button className='dpBtnClose' onClick={onCloseBtnClick}>{locale.btnCloseText}</button>
      </div>
    </div>
  );
}

function createArray(start: number, end: number) {
  return Array.from({length: end - start + 1}, (_, i) => i + start);
}

function getSpan(value: number | string, className?: string, dataset?: string) {
  return <span className={className || undefined} data-date={dataset} key={dataset || value} >{value}</span>;
}

function getSpanList(
    array: number[], 
    dataset: PopupDate, 
    dateSettings: DateSettings, 
    currentDateOpt: Option<Date>, 
    className?: string
) {
  const getDateString = (date: Option<Date>) => nonEmpty(date) 
    ? `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}` : '';
  const today = getDate(Date.now(), dateSettings);
  const todayString = getDateString(today);
  const currDateString = getDateString(toOption(currentDateOpt));
  return array.map(number => {
    const datasetDate = `${number}-${dataset.month}-${dataset.year}`;
    const isCurrent = datasetDate === currDateString;
    const isToday = datasetDate === todayString;
    const classString = `${className || ''} ${isCurrent ? 'current' : ''} ${isToday ? 'today' : ''}`.trim();
    return getSpan(number, classString, datasetDate);
  });
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

// fix for a bug when focus goes to null and popup with datepicker closes
function focusActiveWrapper(popupElement: HTMLDivElement | null) {
  const findActiveFocusWrapper = (el: HTMLElement) => el.classList.contains("activeFocusWrapper") ? el : null;
  const focEl = findFirstParent(findActiveFocusWrapper)(popupElement);
  if (focEl) {
    focEl.focus();
    return true;
  }
}