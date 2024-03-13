import { ColorProps, colorToProps } from "../view-builder/common-api";
import { Calendar, CalendarEvent } from "./calendar";
import { EventInput } from "@fullcalendar/core";

// Server sends timestamps as strings due to Scala Long type may give error in transition to JS number in big numbers
function transformDateFormatProps(props: Calendar<string>): Calendar<number> {
    const { identity, allDaySlot } = props;
    const events = props.events.map(event => ({
        ...event,
        start: event.start ? +event.start : undefined,
        end: event.end ? +event.end : undefined
    }));
    const currentView = props.currentView && {
        ...props.currentView,
        from: +props.currentView.from,
        to: +props.currentView.to
    };
    const businessHours = props.businessHours && {
        ...props.businessHours,
        startTime: +props.businessHours!.startTime,
        endTime: +props.businessHours!.endTime
    };
    return {
        identity, allDaySlot,
        events, currentView, businessHours,
        ...props.slotDuration && { slotDuration: +props.slotDuration }
    }
}

function transformColor(serverEvents: CalendarEvent[]): EventInput[] {
    return serverEvents.map(({ color, ...event }) => {
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

export { transformDateFormatProps, transformColor }