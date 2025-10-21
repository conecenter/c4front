import { usePatchSync } from "../exchange/patch-sync";
import { transformColor } from "./calendar-utils";
import { useSync } from "../../main/vdom-hooks";
import { identityAt } from "../../main/vdom-util";
import { Identity } from "../utils";

import type { Patch, PatchHeaders } from '../exchange/patch-sync';
import type { CalendarEvent, ViewInfo, ViewType } from "./calendar";
import type { EventInput } from '@fullcalendar/core';
import type { EventImpl } from '@fullcalendar/core/internal';

const changeEventIdOf = identityAt('changeEvent');
const changeViewIdOf = identityAt('changeView');

const HEADERS = {
    id: 'x-r-event-id',
    start: 'x-r-event-start',
    end: 'x-r-event-end',
    viewType: 'x-r-view-type',
    from: 'x-r-from',
    to: 'x-r-to',
    resourceIds: 'x-r-resource-ids'
} as const

const changeEventSyncTransformers = {
    serverToState: serverStateToState(transformColor),
    changeToPatch,
    patchToChange,
    applyChange
};

const useEventsSync = (identity: Identity, events: CalendarEvent[]) => {
    const { currentState, sendFinalChange } = usePatchSync(changeEventIdOf(identity), events, false, changeEventSyncTransformers);
    return { eventsState: currentState, sendEventsChange: sendFinalChange };
}

function serverStateToState(transform: (serverState: CalendarEvent[]) => EventInput[]) {
    return (serverState: CalendarEvent[]) => transform(serverState);
}

function changeToPatch(ch: EventImpl): Patch {
    const start = ch.start?.getTime();
    const end = ch.end?.getTime();
    const resourceIds = ch.getResources().map(res => res.id).join('|');
    return {
        value: 'changeEvent',
        headers: {
            [HEADERS.id]: ch.id!,
            ...start && {[HEADERS.start]: String(start)},
            ...end && {[HEADERS.end]: String(end)},
            ...resourceIds && {[HEADERS.resourceIds]: resourceIds}
        }
    }
}

function patchToChange(patch: Patch): EventImpl {
    const headers = patch.headers as PatchHeaders;
    const start = +headers[HEADERS.start];
    const end = +headers[HEADERS.end];
    const resourceIds: string[] | undefined = headers[HEADERS.resourceIds]?.split('|');
    return {
        id: headers[HEADERS.id],
        ...start && {start},
        ...end && {end},
        ...resourceIds && {resourceIds}
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

const useEventClickAction = (identity: Identity) => {
    const [_, enqueueClickActionPatch] = useSync(clickActionIdOf(identity))
    return (clickedEventId: string) => enqueueClickActionPatch({
        value: 'clickAction',
        headers: { [HEADERS.id]: clickedEventId }
    });
}

/////
const changeViewSyncTransformers = {
    serverToState: (s?: ViewInfo) => s,
    changeToPatch: viewChangeToPatch,
    patchToChange: viewPatchToChange,
    applyChange: (_prev: ViewInfo | undefined, ch: ViewInfo) => ch
};

function useViewSync(identity: Identity, serverView: ViewInfo | undefined) {
    const { currentState, sendTempChange } = usePatchSync(
        changeViewIdOf(identity), serverView, false, changeViewSyncTransformers
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