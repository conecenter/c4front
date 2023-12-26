import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import luxon3Plugin from '@fullcalendar/luxon3';
import interactionPlugin from '@fullcalendar/interaction';
import { useUserLocale } from './locale';
import { Patch, usePatchSync } from './exchange/patch-sync';
import { ColorDef, ColorProps, colorToProps } from './view-builder/common-api';

import type { EventChangeArg, EventInput } from '@fullcalendar/core';
import type { EventImpl } from '@fullcalendar/core/internal';

interface Calendar {
    identity: Object,
    events: CalendarEvent[],
    slotDuration?: number,
    businessHours?: BusinessHours,
    allDaySlot?: boolean
}

interface BaseEvent {
    id: string,
    start?: number,
    end?: number
}

interface CalendarEvent extends BaseEvent {
    title: string,
    allDay?: boolean,
    color?: ColorDef
}

interface BusinessHours {
    daysOfWeek: number[],   // 0 = Sunday
    startTime: number,
    endTime: number
}

function Calendar({ identity, events, slotDuration, businessHours, allDaySlot }: Calendar) {
    const {currentState: eventsState, sendFinalChange} = usePatchSync(
        identity, 'receiver', events, false, serverStateToState(transformColor), changeToPatch, patchToChange, applyChange
    );

    const locale = useUserLocale();

    const onEventChange = (changeInfo: EventChangeArg) => {
        const changedEvent = eventObjToBaseEvent(changeInfo.event);
        sendFinalChange({ tp: 'change', event: changedEvent});
    }

    return (
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, luxon3Plugin, interactionPlugin]}
        initialView="dayGridMonth"
        firstDay={1}
        slotDuration={slotDuration || '00:15'}
        timeZone={locale.timezoneId}
        editable={true}
        headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={(_, successCallback) => successCallback(eventsState)}
        eventChange={onEventChange}
        businessHours={businessHours}
        allDaySlot={allDaySlot}
        eventDisplay='block'
        eventConstraint='businessHours'
      />
    );
}

function eventObjToBaseEvent(eventObj: EventImpl): BaseEvent {
    const { id, start, end } = eventObj;
    return {
        id,
        start: start?.getTime(),
        end: end?.getTime()
    };
}

function transformColor(serverState: CalendarEvent[]): EventInput[] {
    return serverState.map(({ color, ...event }) => {
        const { style: colorStyle, className }: ColorProps = colorToProps(color);
        return {
            ...event,
            ...className && { classNames: className },
            ...colorStyle && {
                backgroundColor: colorStyle.backgroundColor,
                textColor: colorStyle.color
            }
        }
    });
}

// Server exchange
type EventChangeType = 'add' | 'change' | 'remove';

interface EventChange {
    tp: EventChangeType,
    event: EventInput
}

function serverStateToState(transform: (serverState: CalendarEvent[]) => EventInput[]) {
    return (serverState: CalendarEvent[]) => transform(serverState);
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

function applyChange(prevState: EventInput[], ch: EventChange): EventInput[] {
    const changingState = [...prevState];
    switch (ch.tp) {
        case 'change':
            const eventIndex = prevState.findIndex(event => event.id === ch.event.id);
            if (eventIndex >= 0) changingState[eventIndex] = { ...changingState[eventIndex], ...ch.event };
            return changingState;
        default:
            return prevState;
    }
}

export { Calendar }