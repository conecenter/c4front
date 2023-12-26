import React, { ReactNode } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import luxon3Plugin from '@fullcalendar/luxon3';
import interactionPlugin from '@fullcalendar/interaction';
import { useUserLocale } from './locale';
import { Patch, PatchHeaders, usePatchSync } from './exchange/patch-sync';
import { ColorDef, ColorProps, colorToProps } from './view-builder/common-api';

import type { EventInput } from '@fullcalendar/core';
import type { EventImpl } from '@fullcalendar/core/internal';

interface Calendar {
    identity: Object,
    events: CalendarEvent[],
    slotDuration?: number,
    businessHours?: BusinessHours,
    allDaySlot?: boolean
}

interface CalendarEvent {
    id: string,
    start?: number,
    end?: number
    title?: string,
    allDay?: boolean,
    color?: ColorDef,
    children?: ReactNode
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
        eventContent={eventInfo => eventInfo.event.extendedProps.children ?? true}
        eventClick={clickedEvent => sendFinalChange({ tp: 'click', event: clickedEvent.event })}
        eventChange={changedEvent => sendFinalChange({ tp: 'change', event: changedEvent.event })}
        businessHours={businessHours}
        allDaySlot={allDaySlot}
        eventDisplay='block'
        eventConstraint='businessHours'
        navLinks={true}
        nowIndicator={true}
      />
    );
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
type EventChangeType = 'change' | 'click';

interface EventChange {
    tp: EventChangeType,
    event: EventImpl
}

const HEADER_ID = 'x-r-event-id';
const HEADER_EVENT_START = 'x-r-event-start';
const HEADER_EVENT_END = 'x-r-event-end';

function serverStateToState(transform: (serverState: CalendarEvent[]) => EventInput[]) {
    return (serverState: CalendarEvent[]) => transform(serverState);
}

function changeToPatch(ch: EventChange): Patch {
    return {
        value: ch.tp,
        headers: getHeaders(ch)
    }
}

function getHeaders(ch: EventChange): PatchHeaders {
    const eventIdHeader = { [HEADER_ID]: ch.event.id! };
    switch (ch.tp) {
        case "click":
            return eventIdHeader;
        case "change":
            const start = ch.event.start?.getTime();
            const end = ch.event.end?.getTime();
            return {
                ...eventIdHeader,
                ...start && {[HEADER_EVENT_START]: String(start)},
                ...end && {[HEADER_EVENT_END]: String(end)}
            }
    }
}

function headersToEvent(patch: Patch) {
    const { value: tp, headers } = patch as { value: EventChangeType, headers: PatchHeaders };
    const id = headers[HEADER_ID]
    switch (tp) {
        case 'click':
            return { id };
        case 'change':
            const start = +headers[HEADER_EVENT_START];
            const end = +headers[HEADER_EVENT_END];
            return {
                id,
                ...start && {start},
                ...end && {end} 
            };
    }
}

function patchToChange(patch: Patch): EventChange {
    return {
        tp: patch.value as EventChangeType,
        event: headersToEvent(patch) as unknown as EventImpl
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