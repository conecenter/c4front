import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import luxon3Plugin from '@fullcalendar/luxon3';
import interactionPlugin from '@fullcalendar/interaction';
import allLocales from '@fullcalendar/core/locales-all';
import { useUserLocale } from '../locale';
import { useEventClickAction, useEventsSync, useViewSync } from './calendar-exchange';
import { LoadingIndicator } from '../loading-indicator';
import { ColorDef } from '../view-builder/common-api';
import { transformDateFormatProps } from './calendar-utils';
import { EventContent } from './event-content';
import { escapeRegex } from '../utils';

import type { DatesSetArg, EventContentArg, FormatterInput, SlotLabelContentArg, ViewApi } from '@fullcalendar/core';

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
    timeSlotsRange?: TimeRange<DateFormat>,
    eventsChildren?: ReactElement[],
    resources?: Resource[]
}

interface CalendarEvent<DateFormat = number> {
    id: string,
    start?: DateFormat,
    end?: DateFormat,
    title?: string,
    allDay?: boolean,
    color?: ColorDef,
    editable?: boolean,
    resourceIds?: string[],
    resourceEditable?: boolean
}

interface TimeRange<DateFormat = number> {
    from: DateFormat,
    to: DateFormat
}

interface ViewInfo<DateFormat = number> extends TimeRange<DateFormat> {
    viewType: ViewType
}

type ViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

interface BusinessHours<DateFormat = number> {
    daysOfWeek: number[],   // 0 = Sunday
    startTime: DateFormat,
    endTime: DateFormat
}

interface Resource {
    id: string,
    title: string
}

function Calendar(props: Calendar<string>) {
    const { identity, events, currentView: serverView, slotDuration, businessHours, allDaySlot, timeSlotsRange, eventsChildren, resources } =
        useMemo(() => transformDateFormatProps(props), [props]);

    const isResourceView = !!resources && resources.length > 0;

    const calendarRef = useRef<FullCalendar>(null);
    const locale = useUserLocale();

    const { eventsState, sendEventsChange } = useEventsSync(identity, events);

    const { currentView, sendViewChange } = useViewSync(identity, serverView);
    const { viewType, from = 0, to = 0 } = currentView || {};

    const onEventClick = useEventClickAction(identity);

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
            const currentViewMiddlePoint = from + ((to - from) / 2);
            view.calendar.changeView(viewType!, currentViewMiddlePoint);
        }
    }, [viewType, from, to]);

    const [isLoading, setIsLoading] = useState(false);
    const viewRoot = useRef<HTMLElement | null>(null);
    const isLoadingOverlay = isLoading && viewRoot.current && createPortal(
        <LoadingIndicator overlayed={true} />,
        viewRoot.current
    );
    useEffect(function switchIsLoading() {
        const needNewEvents = !serverView || !currentView
            || currentView.from < serverView.from || currentView.to > serverView.to;
        if (needNewEvents && !isLoading) setIsLoading(true);
        else if (!needNewEvents && isLoading) setIsLoading(false);
    }, [serverView, currentView, isLoading]);

    const renderEventContent = useCallback((eventInfo: EventContentArg) => {
        // TODO: refactor, key can have ":" added in the beginning of string, keys API can change
        const regExp = new RegExp(`^:?${escapeRegex(eventInfo.event.id)}$`);
        const customContent = eventsChildren?.find(child => regExp.test(child.key as string));
        return <EventContent eventInfo={eventInfo} customContent={customContent} onEventClick={onEventClick} />;
    }, [eventsChildren]);

    return (
        <>
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, luxon3Plugin, interactionPlugin, resourceTimeGridPlugin]}
                initialView={isResourceView ? "resourceTimeGridDay" : "dayGridMonth"}
                resources={resources}
                firstDay={1}
                slotDuration={slotDuration || '00:15'}
                slotLabelFormat={TIME_FORMAT}
                slotLabelContent={fixMidnightPresentation}
                timeZone={locale.timezoneId}
                editable={true}
                businessHours={businessHours}
                allDaySlot={!!allDaySlot}
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
                    right: isResourceView ? '' : 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={eventsState}
                eventTimeFormat={TIME_FORMAT}
                eventContent={renderEventContent}
                eventOverlap={isResourceView ? false : true}
                eventChange={(changedEvent) => sendEventsChange(changedEvent.event)}
                datesSet={onDatesSet}
                viewDidMount={(viewMount) => viewRoot.current = viewMount.el}
                height='auto'
                weekNumbers={true}
                {...timeSlotsRange && {
                    slotMinTime: timeSlotsRange.from,
                    slotMaxTime: timeSlotsRange.to
                }}
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