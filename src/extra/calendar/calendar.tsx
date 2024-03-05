import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import luxon3Plugin from '@fullcalendar/luxon3';
import interactionPlugin from '@fullcalendar/interaction';
import allLocales from '@fullcalendar/core/locales-all';
import { useUserLocale } from '../locale';
import { useEventClickAction, useEventsSync, useViewSync } from './calendar-exchange';
import { OverlayWrapper } from '../overlay-manager';
import { ColorDef } from '../view-builder/common-api';

import type { DatesSetArg, EventInput, EventSourceFuncArg, ViewApi } from '@fullcalendar/core';

interface Calendar {
    identity: object,
    events: CalendarEvent[],
    currentView?: ViewInfo,
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

interface ViewInfo {
    viewType: ViewType,
    from: number,
    to: number
}

type ViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

interface BusinessHours {
    daysOfWeek: number[],   // 0 = Sunday
    startTime: number,
    endTime: number
}

function Calendar({ identity, events, currentView: serverView, slotDuration, businessHours, allDaySlot }: Calendar) {
    const calendarRef = useRef<FullCalendar>(null);
    const locale = useUserLocale();

    const { eventsState, sendEventsChange } = useEventsSync(identity, events);

    const { currentView, sendViewChange } = useViewSync(identity, serverView);
    const { viewType, from = 0, to = 0 } = currentView || {};

    const onEventClick = useEventClickAction(identity);

    const getEvents = useCallback((fetchInfo: EventSourceFuncArg, successCallback: (eventsState: EventInput[]) => void) => {
        const needNewEvents = !serverView
            || fetchInfo.start.getTime() < serverView.from
            || fetchInfo.end.getTime() > serverView.to;
        if (!needNewEvents) successCallback(eventsState);
    }, [events]);

    const onDatesSet = (viewInfo: DatesSetArg) => {
        if (currentView && isViewCurrent(viewInfo.view, currentView)) return;
        sendViewChange({
            viewType: viewInfo.view.type as ViewType,
            from: viewInfo.start.getTime(),
            to: viewInfo.end.getTime()
        });
    }

    useEffect(function keepViewUpdated() {
        const view = calendarRef.current!.getApi().view;
        if (currentView && !isViewCurrent(view, currentView)) {
            view.calendar.changeView(viewType!, { start: from, end: to });
        }
    }, [viewType, from, to]);

    const [isLoading, setIsLoading] = useState(false);
    const viewRoot = useRef<HTMLElement | null>(null);
    const isLoadingOverlay = isLoading && viewRoot.current && createPortal(
        <OverlayWrapper textmsg='Loading, please wait...' />,
        viewRoot.current
    );

    return (
        <>
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, luxon3Plugin, interactionPlugin]}
                initialView="dayGridMonth"
                firstDay={1}
                slotDuration={slotDuration || '00:15'}
                slotLabelFormat={{ hour12: false, hour: 'numeric', minute: '2-digit' }}
                timeZone={locale.timezoneId}
                editable={true}
                businessHours={businessHours}
                allDaySlot={allDaySlot}
                eventDisplay='block'
                eventConstraint='businessHours'
                navLinks={true}
                nowIndicator={true}
                longPressDelay={500}
                locales={allLocales}
                locale={locale.lang}
                headerToolbar={{
                    left: 'prev today next',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={getEvents}
                eventContent={(eventInfo) => eventInfo.event.extendedProps.children ?? true}
                eventClick={onEventClick}
                eventChange={(changedEvent) => sendEventsChange(changedEvent.event)}
                datesSet={onDatesSet}
                viewDidMount={(viewMount) => viewRoot.current = viewMount.el}
                loading={(isLoading) => setIsLoading(isLoading)}
            />
            {isLoadingOverlay}
        </>
    );
}

function isViewCurrent(view: ViewApi, currentView: ViewInfo) {
    const { viewType, from, to } = currentView;
    return view.type === viewType
        && view.activeStart.getTime() === from
        && view.activeEnd.getTime() === to;
}

export type { CalendarEvent, ViewInfo, ViewType }
export { Calendar }