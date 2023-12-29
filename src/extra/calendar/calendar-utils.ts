import { ColorProps, colorToProps } from "../view-builder/common-api";
import { EventInput } from "@fullcalendar/core";
import { CalendarEvent } from "../calendar";

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

export { transformColor }