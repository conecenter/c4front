import { ColorDef, ColorProps, colorToProps } from "../view-builder/common-api";
import { Calendar, EventDuration, TimeRange } from "./calendar";

// Server sends timestamps as strings due to Scala Long type may give error in transition to JS number in big numbers
function transformDateFormatProps(props: Calendar<string>): Calendar<number> {
    const { identity, allDaySlot, eventsChildren } = props;
    const events = props.events.map(transformEventDurationFormat);
    const periodsOfTime = props.periodsOfTime?.map(transformEventDurationFormat);
    const currentView = transformTimeRangeFormat(props.currentView);
    const timeSlotsRange = transformTimeRangeFormat(props.timeSlotsRange);
    return {
        identity, allDaySlot, eventsChildren,
        events, periodsOfTime, currentView, timeSlotsRange,
        ...props.slotDuration && { slotDuration: +props.slotDuration }
    }
}

function transformEventDurationFormat<T extends EventDuration<string>>(event: T) {
    return ('daysOfWeek' in event)
        ? { ...event, startTime: msStringToNumber(event.startTime), endTime: msStringToNumber(event.endTime), daysOfWeek: event.daysOfWeek }
        : { ...event, start: msStringToNumber(event.start), end: msStringToNumber(event.end) };
}

function transformTimeRangeFormat<T extends TimeRange<string>>(prop?: T) {
    return prop && { ...prop, from: msStringToNumber(prop.from), to: msStringToNumber(prop.to) }
}

function msStringToNumber(timestamp: string): number;
function msStringToNumber(timestamp?: string): number | undefined;
function msStringToNumber(timestamp?: string) {
    return timestamp ? +timestamp : undefined;
}

function transformColor<T extends { color?: ColorDef }>({ color, ...event }: T) {
    const { style: colorStyle, className }: ColorProps = colorToProps(color);
    return {
        ...event,
        ...className && { classNames: className },
        ...colorStyle && {
            backgroundColor: colorStyle.backgroundColor,
            textColor: colorStyle.color
        }
    };
}

export { transformDateFormatProps, transformColor }