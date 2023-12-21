import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';

interface Calendar {
    events: CalendarEvent[]
}

interface CalendarEvent {
    title: string,
    start: number,
    end?: number,
    allDay?: boolean
}

function Calendar({ events }: Calendar) {
    return (
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        firstDay={1}
        slotDuration={'00:15'}
        headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
      />
    );
}

export { Calendar }