import React, {createElement as el} from "react";

export function DatepickerCalendar() {
  const daysCurrMonth = Array.from({length: 30}, (_, i) => 
    <span key={`curr${i + 1}`}>{i + 1}</span>);

  const daysNextMonth = Array.from({length: 12}, (_, i) => 
    <span className='dayNextMonth' key={`next${i + 1}`}>{i + 1}</span>);

  let weekNumbers = [44, 45, 46, 47, 48, 49]
    .map(week => <span key={`wk${week}`}>{week}</span>);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    .map(weekDay => <span key={`wd${weekDay}`}>{weekDay}</span>)

  return (
    <div className='dpCalendar'>
      <h2>November 2021</h2>
      <div className='dpCalendarContainer'>
        <div className='dpCalendarWeekDays'>
            {weekDays}
        </div>
        <div className='dpCalendarWeekNums'>
          {weekNumbers}
        </div>
        <div className='dpCalendarDays'>
          {daysCurrMonth}
          {daysNextMonth}
        </div>
      </div>
    </div>
  );
}