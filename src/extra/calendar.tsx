import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import luxon3Plugin from '@fullcalendar/luxon3';
import interactionPlugin from '@fullcalendar/interaction';
import { useUserLocale } from './locale';
import { Patch, usePatchSync } from './exchange/patch-sync';

import type { EventChangeArg } from '@fullcalendar/core';
import type { EventImpl } from '@fullcalendar/core/internal';

interface Calendar {
    identity: Object,
    events: CalendarEvent[]
}

interface CalendarEvent {
    id: string,
    title: string,
    start?: number,
    end?: number,
    allDay?: boolean
}

function Calendar({ identity, events }: Calendar) {
    const {currentState: eventsState, sendFinalChange} = 
        usePatchSync(identity, 'receiver', events, false, s => s, changeToPatch, patchToChange, applyChange);

    const locale = useUserLocale();

    const onEventChange = (changeInfo: EventChangeArg) => {
        const changedEvent = eventObjToCalendarEvent(changeInfo.event);
        sendFinalChange({ tp: 'change', event: changedEvent});
    }

    return (
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, luxon3Plugin, interactionPlugin]}
        initialView="dayGridMonth"
        firstDay={1}
        slotDuration={'00:15'}
        timeZone={locale.timezoneId}
        editable={true}
        headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={(_, successCallback) => successCallback(eventsState)}
        eventChange={onEventChange}
      />
    );
}

function eventObjToCalendarEvent(eventObj: EventImpl) {
    const { id, title, start, end, allDay } = eventObj;
    return {
        id, title,
        start: start?.getTime(),
        end: end?.getTime(),
        ...allDay && { allDay }
    };
}

// Server exchange
type EventChangeType = 'add' | 'change' | 'remove';

interface EventChange {
    tp: EventChangeType,
    event: CalendarEvent
}

function changeToPatch(ch: EventChange): Patch {
    return {
        value: JSON.stringify(ch.event),
        headers: { 'x-r-tp': ch.tp }
    }
}

function patchToChange(patch: Patch): EventChange {
    return {
        tp: patch.headers!['x-r-tp'] as EventChangeType,
        event: JSON.parse(patch.value)
    };
}

function applyChange(prevState: CalendarEvent[], ch: EventChange): CalendarEvent[] {
    const changingState = [...prevState];
    switch (ch.tp) {
        case 'change':
            const eventIndex = prevState.findIndex(event => event.id === ch.event.id);
            if (eventIndex >= 0) changingState.splice(eventIndex, 1, ch.event);
            return changingState;
        default:
            return prevState;
    }
}

export { Calendar }