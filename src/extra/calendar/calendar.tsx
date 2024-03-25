import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { transformDateFormatProps } from './calendar-utils';

import type { DatesSetArg, EventContentArg, EventInput, EventSourceFuncArg, FormatterInput, SlotLabelContentArg, ViewApi } from '@fullcalendar/core';

const TIME_FORMAT: FormatterInput = {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    meridiem: false
}

interface Calendar<DateFormat = number> {
    identity: object,
    events: CalendarEvent<DateFormat>[],
    currentView?: ViewInfo<DateFormat>,
    slotDuration?: DateFormat,
    businessHours?: BusinessHours<DateFormat>,
    allDaySlot?: boolean,
    eventsChildren?: ReactElement[]
}

interface CalendarEvent<DateFormat = number> {
    id: string,
    start?: DateFormat,
    end?: DateFormat,
    title?: string,
    allDay?: boolean,
    color?: ColorDef,
    editable?: boolean
}

interface ViewInfo<DateFormat = number> {
    viewType: ViewType,
    from: DateFormat,
    to: DateFormat
}

type ViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

interface BusinessHours<DateFormat = number> {
    daysOfWeek: number[],   // 0 = Sunday
    startTime: DateFormat,
    endTime: DateFormat
}

function Calendar(props: Calendar<string>) {
    const { identity, events, currentView: serverView, slotDuration, businessHours, allDaySlot, eventsChildren } = useMemo(
        () => transformDateFormatProps(props), [props]
    );

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
    }, [eventsState]);

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
                slotLabelFormat={TIME_FORMAT}
                slotLabelContent={fixMidnightPresentation}
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
                eventTimeFormat={TIME_FORMAT}
                eventContent={(eventInfo) => eventsChildren?.find(child => child.key === eventInfo.event.id) ?? true}
                eventClick={onEventClick}
                eventChange={(changedEvent) => sendEventsChange(changedEvent.event)}
                datesSet={onDatesSet}
                viewDidMount={(viewMount) => viewRoot.current = viewMount.el}
                loading={(isLoading) => setIsLoading(isLoading)}
                height='auto'
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

function fixMidnightPresentation(info: SlotLabelContentArg) {
    return info.text.replace(/^24/, '00');
}

export type { CalendarEvent, ViewInfo, ViewType }
export { Calendar }