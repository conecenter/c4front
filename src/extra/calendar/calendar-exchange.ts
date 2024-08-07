import { usePatchSync } from "../exchange/patch-sync";
import { transformColor } from "./calendar-utils";
import { useSync } from "../../main/vdom-hooks";
import { identityAt } from "../../main/vdom-util";

import type { Patch, PatchHeaders } from '../exchange/patch-sync';
import type { CalendarEvent, ViewInfo, ViewType } from "./calendar";
import type { EventInput } from '@fullcalendar/core';
import type { EventImpl } from '@fullcalendar/core/internal';

const HEADERS = {
    id: 'x-r-event-id',
    start: 'x-r-event-start',
    end: 'x-r-event-end',
    viewType: 'x-r-view-type',
    from: 'x-r-from',
    to: 'x-r-to'
}

const useEventsSync = (identity: object, events: CalendarEvent[]) => {
    const { currentState, sendFinalChange } = usePatchSync(
        identity, 'changeEvent', events, false, serverStateToState(transformColor), changeToPatch, patchToChange, applyChange
    );
    return { eventsState: currentState, sendEventsChange: sendFinalChange };
}

function serverStateToState(transform: (serverState: CalendarEvent[]) => EventInput[]) {
    return (serverState: CalendarEvent[]) => transform(serverState);
}

function changeToPatch(ch: EventImpl): Patch {
    const start = ch.start?.getTime();
    const end = ch.end?.getTime();
    return {
        value: 'changeEvent',
        headers: {
            [HEADERS.id]: ch.id!,
            ...start && {[HEADERS.start]: String(start)},
            ...end && {[HEADERS.end]: String(end)}
        }
    }
}

function patchToChange(patch: Patch): EventImpl {
    const headers = patch.headers as PatchHeaders;
    const start = +headers[HEADERS.start];
    const end = +headers[HEADERS.end];
    return {
        id: headers[HEADERS.id],
        ...start && {start},
        ...end && {end}
    } as unknown as EventImpl;
}

function applyChange(prevState: EventInput[], ch: EventImpl): EventInput[] {
    const changingState = [...prevState];
    const eventIndex = prevState.findIndex(event => event.id === ch.id);
    if (eventIndex >= 0) changingState[eventIndex] = { ...changingState[eventIndex], ...ch };
    return changingState;
}

/////
const clickActionIdOf = identityAt('clickAction');

const useEventClickAction = (identity: object) => {
    const [_, enqueueClickActionPatch] = useSync(clickActionIdOf(identity))
    return (clickedEventId: string) => enqueueClickActionPatch({
        value: 'clickAction',
        headers: { [HEADERS.id]: clickedEventId }
    });
}

/////
function useViewSync(identity: object, serverView: ViewInfo | undefined) {
    const { currentState, sendTempChange } = usePatchSync(
        identity, 'changeView', serverView, false, s => s, viewChangeToPatch, viewPatchToChange, (prev, ch) => ch
    );
    return { currentView: currentState, sendViewChange: sendTempChange };
}

function viewChangeToPatch(ch: ViewInfo): Patch {
    return {
        value: 'changeView',
        headers: {
            [HEADERS.viewType]: ch.viewType,
            [HEADERS.from]: String(ch.from),
            [HEADERS.to]: String(ch.to)
        }
    };
}

function viewPatchToChange(patch: Patch): ViewInfo {
    const headers = patch.headers as PatchHeaders;
    return {
        viewType: headers[HEADERS.viewType] as ViewType,
        from: +headers[HEADERS.from],
        to: +headers[HEADERS.to]
    }
}

export { useEventsSync, useEventClickAction, useViewSync }