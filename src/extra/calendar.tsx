import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import luxon3Plugin from '@fullcalendar/luxon3';
import { useUserLocale } from './locale';

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
    const locale = useUserLocale();

    return (
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, luxon3Plugin]}
        initialView="dayGridMonth"
        firstDay={1}
        slotDuration={'00:15'}
        timeZone={locale.timezoneId}
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