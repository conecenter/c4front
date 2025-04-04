import React, { MouseEvent } from "react";
import { useUserLocale } from "../locale";
import { addMonths, getDate as getDayOfMonth, getDaysInMonth, getWeek, isMonday, set, startOfWeek } from "date-fns";
import { isEmpty, nonEmpty, Option, toOption } from '../../main/option';
import { adjustDate, DateSettings, getDate, getTimestamp, getPopupDate, getTimestampNow } from "./date-utils";
import { createPopupChange, createTimestampChange, DatepickerChange, DatePickerState, PopupDate } from "./datepicker-exchange";
import { PopupElement } from "../popup-elements/popup-element";
import { usePopupState } from "../popup-elements/popup-manager";
import { createArray } from "../utils";

const WEEKS_TO_SHOW = 6;

const CALENDAR_CLASSNAME = 'dpCalendar';
const MONTHS_POPUP_KEY = "datePicker-months";


interface DatepickerCalendarProps {
  currentState: DatePickerState,
  currentDateOpt: Option<Date>,
  dateSettings: DateSettings,
  sendFinalChange: (ch: DatepickerChange, force?: boolean) => void,
  sendTempChange: (ch: DatepickerChange) => void,
  inputRef: React.MutableRefObject<HTMLInputElement | null>,
  closePopup: () => void
}

export function DatepickerCalendar({
  currentState,
  currentDateOpt,
  dateSettings,
  sendFinalChange,
  sendTempChange,
  inputRef,
  closePopup
}: DatepickerCalendarProps) {

  const popupDate = currentState.popupDate as PopupDate;
  const { year, month } = popupDate;

  const pageDate = new Date(year, month);

  const locale = useUserLocale();

  /*
   * Months section functionality
  */
  const currMonthObj = locale.months.find(monthName => monthName.id === month);
  const currMonthName = currMonthObj ? currMonthObj.fullName : null;

  function onMonthArrowClick(e: MouseEvent<HTMLButtonElement>) {
    const change = e.currentTarget.dataset.change;
    if (change) {
      const newDate = addMonths(new Date(year, month), Number(change));
      sendTempChange(createPopupChange(getPopupDate(newDate)));
    }
  }

  const { isOpened, toggle } = usePopupState(MONTHS_POPUP_KEY);

  function onMonthChoice(e: MouseEvent<HTMLButtonElement>) {
    const newMonth = e.currentTarget.dataset.month;
    if (newMonth) sendTempChange(createPopupChange({ year, month: Number(newMonth) }));
    toggle(false);
  }

  /*
   * Years section functionality
  */
  const yearsArrowBtnsDiv = getArrowBtnsDiv(onCalendarYearChange);

  function onCalendarYearChange(e: MouseEvent<HTMLButtonElement>) {
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

  function onDateChoice(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.dataset.date) return;
    const dateValues = target.dataset.date.split('-');
    const isDateAvailable = nonEmpty(currentDateOpt);
    const baseDate = isDateAvailable ? currentDateOpt : getDate(Date.now(), dateSettings);
    if (isEmpty(baseDate)) return;
    const timeSettings = isDateAvailable ? {} : { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
    const chosenDate = set(baseDate, {
        year: +dateValues[2],
        month: +dateValues[1],
        date: +dateValues[0],
        ...timeSettings
    });
    sendFinalChange(createTimestampChange(getTimestamp(chosenDate, dateSettings)), true);
    closePopup();
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
    return (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.dataset.change) return;
      if (nonEmpty(currentDateOpt)) {
          const adjustedDate = adjustDate(currentDateOpt, symbol, +e.currentTarget.dataset.change, true);
          sendTempChange(createTimestampChange(getTimestamp(adjustedDate, dateSettings)));
      }
      else sendTempChange(createTimestampChange(getTimestampNow(dateSettings)));
    }
  }

  /*
   * Now & Close buttons functionality
  */
  const onNowBtnClick = () => {
    sendFinalChange(createTimestampChange(getTimestampNow(dateSettings)), true);
    closePopup();
  }

  function onCloseBtnClick() {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(100, 100);
    }
    closePopup();
  }

  return (
    <div
      className={CALENDAR_CLASSNAME}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => toggle(false)} >

      <div className='dpCalendarHeader'>
        <button data-change='-1' onClick={onMonthArrowClick} />

        <div className="dpCalendarMonthYear">
          <div className='dpCalendarMonth'>
            <button
              type='button'
              className={isOpened ? 'rotateArrow' : undefined}
              onClick={() => toggle(!isOpened)}>
                {currMonthName}
            </button>

            {isOpened && <PopupElement popupKey={MONTHS_POPUP_KEY} className='dpMonthsPopup'>
              {locale.months.map(month =>
                <span key={month.fullName} onClick={onMonthChoice} data-month={month.id}>{month.fullName}</span>
              )}
            </PopupElement>}
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

export { CALENDAR_CLASSNAME }