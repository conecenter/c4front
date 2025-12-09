import { MutableRefObject, useContext, useEffect, useLayoutEffect, useRef } from "react";
import { ScrollInfoContext } from "../scroll-info-context";
import { TimeRange, ViewType } from "./calendar";
import { ViewMountArg } from "@fullcalendar/core";

const FC_HEADER_SEL = '.fc-col-header';
const FC_ROW_SEL = '.fc-timegrid-body tr';
const FC_TIME_SLOT_SEL = '.fc-timegrid-slot';
const DATA_TIME_ATTR = 'data-time';

function useScrollCorrection(
    viewRoot: MutableRefObject<HTMLElement | null>,
    viewType?: ViewType,
    timeSlotsRange?: TimeRange<number>
) {
    const { setScrollLock } = useContext(ScrollInfoContext);
    const savedScrollTime = useRef<string | null>(null);

    useEffect(
        function correctScroll() {
            const savedScrollSel = `${FC_TIME_SLOT_SEL}[${DATA_TIME_ATTR}="${savedScrollTime.current}"]`;
            const savedScrollElem = viewRoot.current?.querySelector<HTMLElement>(savedScrollSel);
            const header = viewRoot.current?.querySelector<HTMLElement>(FC_HEADER_SEL);
            const win = viewRoot.current?.ownerDocument.defaultView;

            if (!win) return;
            if (!savedScrollTime.current || !savedScrollElem || !header) return win.scrollTo({ top: 0 });

            const { bottom: headerBottom } = header.getBoundingClientRect();
            const { top: targetTop } = savedScrollElem.getBoundingClientRect();

            setScrollLock(true);
            win.scrollBy({ top: targetTop - headerBottom });
            setTimeout(() => setScrollLock(false), 100);
        },
        [viewType, timeSlotsRange?.from, timeSlotsRange?.to]
    );

    useLayoutEffect(
        function saveOnTimeSlotsChange() {
            // saving in return allows to catch prev scroll before FC internally renders
            return () => {
                savedScrollTime.current = viewType && isTimeGridView(viewType)
                    ? getCurrScrollTime(viewRoot.current) : null;
            }
        },
        [timeSlotsRange?.from, timeSlotsRange?.to]
    );

    function onViewWillUnmount(viewArg: ViewMountArg) {
        savedScrollTime.current = isTimeGridView(viewArg.view.type) ? getCurrScrollTime(viewArg.el) : null;
    }

    return onViewWillUnmount;
}

function isTimeGridView(viewType: string) {
    return viewType.toLowerCase().includes('timegrid');
}

function getCurrScrollTime(fcRoot: HTMLElement | null) {
    if (!fcRoot) return null;
    const fcRows = Array.from(fcRoot.querySelectorAll(FC_ROW_SEL));
    const header = fcRoot.querySelector<HTMLElement>(FC_HEADER_SEL);
    if (fcRows.length === 0 || !header) return null;

    const { bottom: headerBottom } = header.getBoundingClientRect();
    const closestVisibleRow = fcRows.find((row) => {
        const { top: rowTop, height } = row.getBoundingClientRect();
        return (rowTop + height / 2) >= headerBottom;
    });
    return closestVisibleRow
        ?.querySelector<HTMLElement>(`${FC_TIME_SLOT_SEL}[${DATA_TIME_ATTR}]`)
        ?.getAttribute(DATA_TIME_ATTR) || null;
}

export { useScrollCorrection }