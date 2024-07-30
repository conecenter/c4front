import React, { ReactElement } from 'react';
import { EventContentArg } from '@fullcalendar/core';

interface EventContent {
    eventInfo: EventContentArg,
    customContent?: ReactElement,
    onEventClick: (clickedEventId: string) => void
}

function EventContent({ eventInfo, customContent, onEventClick }: EventContent) {
    return (
        <div onClick={() => onEventClick(eventInfo.event.id)} tabIndex={-1} className="fc-event-main-frame">
            <div className="fc-event-time">{eventInfo.timeText}</div>
            <div className="fc-event-title-container">
                <div className="fc-event-title fc-sticky">{eventInfo.event.title}</div>
            </div>
            {customContent}
        </div>
    );
}

export { EventContent }