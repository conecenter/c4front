import React, { ReactElement } from 'react';
import { EventContentArg } from '@fullcalendar/core';

interface EventContent {
    eventInfo: EventContentArg,
    customContent?: ReactElement
}

function EventContent({ eventInfo, customContent }: EventContent) {
    return (
        <div tabIndex={-1} className="fc-event-main-frame">
            <div className="fc-event-time">{eventInfo.timeText}</div>
            <div className="fc-event-title-container">
                <div className="fc-event-title fc-sticky">{eventInfo.event.title}</div>
            </div>
            {customContent}
        </div>
    );
}

export { EventContent }