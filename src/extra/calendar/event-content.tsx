import React, { ReactElement } from 'react';
import clsx from 'clsx';
import { EventContentArg } from '@fullcalendar/core';
import { useFocusControl } from '../focus-control';

interface EventContent {
    eventInfo: EventContentArg,
    customContent?: ReactElement,
    onEventClick: (clickedEventId: string) => void
}

function EventContent({ eventInfo, customContent, onEventClick }: EventContent) {
    const { focusClass, focusHtml } = useFocusControl(eventInfo.event.id);
    return (
        <div
            onClick={() => onEventClick(eventInfo.event.id)}
            className={clsx("fc-event-main-frame", focusClass)}
            {...focusHtml}
        >
            <div className="fc-event-time">{eventInfo.timeText}</div>
            <div className="fc-event-title-container">
                <div className="fc-event-title fc-sticky">{eventInfo.event.title}</div>
            </div>
            {customContent}
        </div>
    );
}

export { EventContent }