import React, { lazy, Suspense } from 'react';
import { LoadingIndicator } from '../loading-indicator';

import type { CalendarProps } from 'types/c4gen.CalendarApi';

const Calendar = lazy(() =>
    import(
        /* webpackChunkName: "full-calendar" */
        './calendar'
    )
);

function LazyCalendar(props: CalendarProps) {
    return (
        <Suspense fallback={<LoadingIndicator />}>
            <Calendar {...props} />
        </Suspense>
    );
}

export { LazyCalendar as Calendar };