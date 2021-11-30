import React, {createElement as el} from "react";

export function DatepickerCalendar() {
  const daysCurrMonth = [];
  for (let i = 1; i <= 30; i++) {
    daysCurrMonth.push(<span key={`curr${i}`}>{i}</span>);
  }

  const daysNextMonth = [];
  for (let i = 1; i <= 12; i++) {
    daysNextMonth.push(<span className='dayNextMonth' key={`next${i}`}>{i}</span>);
  }

  let weekNumbers = [44, 45, 46, 47, 48, 49]
    .map(week => <span key={`wk${week}`}>{week}</span>);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    .map(weekDay => <span key={`wd${weekDay}`}>{weekDay}</span>)

  return (
    <div className='dpCalendar'>
      <h2>November 2021</h2>
      <div className='dpCalendarContainer'>
        <div className='dpCalendarWeekDays'>
            <span />
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

// el('div', {className: 'calendar'},
//   el('h2', null, 'November 2021'),
//   el('div', {className: 'calendarContainer'},
//     el('div', {className: 'calendarWeekDays'},
//       el('span'),
//       weekDays
//     ),
//     el('div', {className: 'calendarWeekNums'}, weekNumbers),
//     el('div', {className: 'calendarDays'},
//       daysCurrMonth,
//       daysNextMonth
//     )
//   )    
// );