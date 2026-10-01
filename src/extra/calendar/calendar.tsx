import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import luxon3Plugin from '@fullcalendar/luxon3';
import interactionPlugin from '@fullcalendar/interaction';
import allLocales from '@fullcalendar/core/locales-all';
import { ResourceLabelContentArg } from '@fullcalendar/resource/index.js';
import { useUserLocale } from '../locale';
import { useEventClickAction, useEventDragAction, useEventsSync, useViewSync } from './calendar-exchange';
import { LoadingIndicator } from '../loading-indicator';
import { colorToProps } from '../view-builder/common-api';
import type { CalendarProps } from 'types/c4gen.CalendarApi';
import type { ColorDef } from 'types/c4gen.CommonElementsApi';
import { transformDateFormatProps } from './calendar-utils';
import { EventContent } from './event-content';
import { escapeRegex } from '../utils';
import { useLatest } from '../custom-hooks';
import { useScrollCorrection } from './useScrollCorrection';
import { useTimeOffsetKey } from './useTimeOffsetKey';

import type { DatesSetArg, EventContentArg, EventInput, FormatterInput, SlotLabelContentArg, ViewApi } from '@fullcalendar/core';

const TIME_FORMAT: FormatterInput = {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    meridiem: false
}

const ALLOW_DROP_GROUP_ID = 'allowDrop';

interface CalendarInternal {
    identity: object,
    events: CalendarEvent[],
    periodsOfTime?: PeriodOfTime<number>[],
    currentView?: ViewInfo,
    slotDuration?: number,
    allDaySlot?: boolean,
    timeSlotsRange?: TimeRange,
    eventsChildren?: ReactElement[],
    resources?: Resource[]
}

type BaseEvent<DateFormat = number> = EventDuration<DateFormat> & {
    id: string
}

type CalendarEvent<DateFormat = number> = BaseEvent<DateFormat> & {
    color?: ColorDef,
    title?: string,
    allDay?: boolean,
    editable?: boolean,
    resourceIds?: string[],
    resourceEditable?: boolean,
    eventParts?: EventPart[],
    hint?: string
}

type PeriodOfTime<DateFormat> = BaseEvent<DateFormat> & {
    allowDrop: boolean
}

type EventDuration<DateFormat> = SingleDuration<DateFormat> | RecurringDuration<DateFormat>

interface SingleDuration<DateFormat> {
    start: DateFormat,
    end?: DateFormat
}

interface RecurringDuration<DateFormat> {
    daysOfWeek: number[],   // 0 = Sunday
    startTime?: DateFormat,  // if omitted - allDay
    endTime?: DateFormat
}

interface TimeRange<DateFormat = number> {
    from: DateFormat,
    to: DateFormat
}

interface ViewInfo<DateFormat = number> extends TimeRange<DateFormat> {
    viewType: ViewType
}

type ViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'resourceTimeGridDay';


interface Resource {
    id: string,
    title: string,
    color?: ColorDef
}

interface EventPart<DateFormat = number> {
    endTime: DateFormat,
    color: ColorDef,
    hint?: string
}

function Calendar(props: CalendarProps) {
    const { identity, events, periodsOfTime = [], currentView: serverView, slotDuration, allDaySlot, timeSlotsRange, eventsChildren, resources } =
        useMemo(() => transformDateFormatProps(props), [props]);

    const isResourceView = !!resources && resources.length > 0;
    const orderedResourses = resources?.map((res, i) => ({ ...res, index: i }));

    const calendarRef = useRef<FullCalendar>(null);
    const locale = useUserLocale();

    const { eventsState, sendEventsChange } = useEventsSync(identity, events);

    const backgroundEvents = periodsOfTime.map(periodOfTimeToBgEvent);

    const { currentView, sendViewChange } = useViewSync(identity, serverView);
    const { viewType, from = 0, to = 0 } = currentView || {};
    const prevServerView = useLatest(serverView);

    const onEventClick = useEventClickAction(identity);

    const onEventDrag = useEventDragAction(identity);

    const onDatesSet = (viewInfo: DatesSetArg) => {
        if ((currentView && isViewCurrent(viewInfo.view, currentView))
            || prevServerView.current !== serverView) return;
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
        return <EventContent eventInfo={eventInfo} customContent={customContent} />;
    }, [eventsChildren]);

    const onViewWillUnmount = useScrollCorrection(viewRoot, viewType, timeSlotsRange);

    const next = useTimeOffsetKey();

    return (
        <>
            <FullCalendar
                key={next}
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, luxon3Plugin, interactionPlugin, resourceTimeGridPlugin]}
                initialView={viewType || (isResourceView ? "resourceTimeGridDay" : "dayGridMonth")}
                resources={orderedResourses}
                resourceOrder={'index'}
                resourceLabelContent={renderResourceLabelContent}
                firstDay={1}
                slotDuration={slotDuration || '00:15'}
                slotLabelFormat={TIME_FORMAT}
                slotLabelContent={fixMidnightPresentation}
                timeZone={locale.timezoneId}
                editable={true}
                allDaySlot={!!allDaySlot}
                eventDisplay='block'
                eventConstraint={ALLOW_DROP_GROUP_ID}
                navLinks={true}
                nowIndicator={true}
                now={() => Date.now() + (next ?? 0)}
                longPressDelay={500}
                locales={allLocales}
                locale={locale.shortName === 'ruen' ? 'en-gb' : locale.lang}
                headerToolbar={{
                    left: 'prev today next',
                    center: 'title',
                    right: `dayGridMonth,timeGridWeek,${isResourceView ? 'resourceTimeGridDay' : 'timeGridDay'}`
                }}
                events={[...eventsState, ...backgroundEvents]}
                eventTimeFormat={TIME_FORMAT}
                eventContent={renderEventContent}
                eventClick={(e) => onEventClick(e.event.id)}
                eventOverlap={isResourceView ? false : true}
                eventChange={(changedEvent) => sendEventsChange(changedEvent.event)}
                datesSet={onDatesSet}
                viewDidMount={(viewMount) => viewRoot.current = viewMount.el}
                viewWillUnmount={onViewWillUnmount}
                height='auto'
                weekNumbers={true}
                {...timeSlotsRange && {
                    slotMinTime: timeSlotsRange.from,
                    slotMaxTime: timeSlotsRange.to
                }}
                eventDragStart={(ev) => onEventDrag(ev, true)}
                eventDragStop={(ev) => onEventDrag(ev, false)}
                schedulerLicenseKey="0202815262-fcs-1758711158"
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

function renderResourceLabelContent(res: ResourceLabelContentArg) {
    const { className, style } = colorToProps(res.resource.extendedProps.color);
    return (
        <>
            <div className={clsx("resourceBg", className)} style={style} />
            <span className={className} style={style}>{res.resource.title}</span>
        </>
    );
}

function periodOfTimeToBgEvent({ allowDrop, ...periodOfTime }: PeriodOfTime<number>): EventInput {
    const isAllDay = isRecurringDuration(periodOfTime) && periodOfTime.startTime === 0 && periodOfTime.endTime === 86400000;
    return {
        ...isAllDay && { allDay: true },
        ...periodOfTime,
        ...!allowDrop && { classNames: ['calendar-period-blocked'] },
        ...allowDrop && { groupId: ALLOW_DROP_GROUP_ID },
        display: 'background'
    };
}

function isRecurringDuration<DateFormat>(
    duration: SingleDuration<DateFormat> | RecurringDuration<DateFormat>
): duration is RecurringDuration<DateFormat> {
    return (duration as RecurringDuration<DateFormat>).daysOfWeek !== undefined;
}

export type { CalendarInternal, CalendarEvent, EventDuration, ViewInfo, ViewType, EventPart, TimeRange }
export { Calendar }
export default Calendar
