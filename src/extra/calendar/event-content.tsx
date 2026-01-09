import React, { ReactElement } from 'react';
import clsx from 'clsx';
import { EventContentArg } from '@fullcalendar/core';
import { useFocusControl } from '../focus-control';
import { EventPart } from './calendar';
import { colorToProps } from '../view-builder/common-api';
import { Tooltip } from '../tooltip';

interface EventContent {
    eventInfo: EventContentArg,
    customContent?: ReactElement
}

function EventContent({ eventInfo, customContent }: EventContent) {
    const { focusClass, focusHtml } = useFocusControl(eventInfo.event.id);

    const eventParts = eventInfo.event.extendedProps.eventParts as EventPart[] | undefined;
    const hasEventParts = eventParts && eventParts.length > 0;

    return (
        <div
            className={clsx('fcEventWrapper', focusClass, hasEventParts && 'fc-event-parts')}
            {...focusHtml}
        >
            <Tooltip
                side='top'
                key={eventInfo.event.id}
                content={eventInfo.event.extendedProps.hint}
            >
                <div className='fc-event-main-frame' style={{ height: 'auto' }}>
                    <div className="fc-event-time">{eventInfo.timeText}</div>
                    <div className="fc-event-title-container">
                        <div className="fc-event-title fc-sticky">{eventInfo.event.title}</div>
                    </div>
                </div>
            </Tooltip>

            {eventInfo.isStart && customContent}

            {hasEventParts &&
                <EventProgressBar eventParts={eventParts} eventInfo={eventInfo} />}
        </div>
    );
}

interface EventProgressBar {
    eventParts: EventPart[],
    eventInfo: EventContentArg
}

function EventProgressBar({ eventParts, eventInfo }: EventProgressBar) {
    const eventStart = eventInfo.event.start?.getTime();
    const eventEnd = eventInfo.event.end?.getTime();

    if (!eventStart || !eventEnd) return null;

    const tooltipSide = eventInfo.view.type === 'dayGridMonth' ? 'bottom' : 'right';

    const isOverflowStart = eventParts[0].endTime <= eventStart;
    const isOverflowEnd = eventParts[eventParts.length - 1].endTime > eventEnd;

    function getEventPart(part: EventPart<number>, ind: number) {
        if (!eventStart || !eventEnd) return null;
        const startTime = ind === 0 ? eventStart : eventParts[ind - 1].endTime;
        const endTime = part.endTime;
        if (startTime >= eventEnd || endTime <= eventStart) return null;

        const partStart = Math.max(startTime, eventStart);
        const partEnd = Math.min(endTime, eventEnd);
        const percentage = ((partEnd - partStart) * 100 / (eventEnd - eventStart)).toFixed(2);

        const { className, style } = colorToProps(part.color);

        return (
            <Tooltip key={part.endTime} side={tooltipSide} content={part.hint}>
                <div
                    style={{ flexBasis: `${percentage}%`, ...style }}
                    className={className}
                    onClick={(e) => e.stopPropagation()}
                />
            </Tooltip>
        );
    }

    return (
        <div className={clsx('fc-progress-bar', isOverflowStart && 'overflowStart', isOverflowEnd && 'overflowEnd')}>
            {eventParts.map(getEventPart)}
        </div>
    );
}

export { EventContent }