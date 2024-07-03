import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import { Calendar, CalendarEvent } from "../../extra/calendar/calendar";
import { ButtonElement } from "../../extra/button-element";

function App() {
    const eventChild = [
        $('div', {key: 'Meeting'},
        $(ButtonElement, {key: '1', value: '', path: '/button', className: 'yellowColorCss', onClick: () => console.log('clicked')}, 'Full calendar'))
    ];

    const events: CalendarEvent<string>[] = [
        {
            id: 'Meeting',
            title: 'Meeting',
            start: new Date(2024, 5, 20, 12).getTime().toString(),
            end: new Date(2024, 5, 20, 14).getTime().toString(),
            color: { tp: 'p', cssClass: 'primaryColorCss' }
        },
        {
            id: 'Meeting-2',
            title: 'Meeting-2',
            start: new Date(2024, 5, 21, 14).getTime().toString(),
            end: new Date(2024, 5, 21, 16).getTime().toString()
        },
        {
            id: 'Meeting-3',
            title: 'Meeting-3',
            start: new Date(2024, 5, 21, 14).getTime().toString(),
            end: new Date(2024, 5, 21, 16).getTime().toString()
        },
        {
            id: 'Car arrival',
            title: 'Car arrival',
            start: new Date(2024, 5, 21, 10).getTime().toString(),
            end: new Date(2024, 5, 21, 14).getTime().toString(),
            color: { tp: 'r', bgColor: 'grey', textColor: 'white' }
        },
        {
            id: 'Train departure',
            title: 'Train departure',
            start: new Date(2024, 5, 20).getTime().toString(),
            allDay: true
        }
    ];

    const calendar = $(Calendar, {
        identity: { key: 'test' },
        periodsOfTime: [
            {
                id: 'period_0',
                allowDrop: true,
                daysOfWeek: [1, 2, 3, 4, 5],
                // startTime: '28800000',
                // endTime: '64800000',
                color: { tp: 'r', bgColor: 'green', textColor: 'white' }
            },
            {
                id: 'period_1',
                allowDrop: false,
                daysOfWeek: [0],
                startTime: '28800000',
                endTime: '64800000',
                color: { tp: 'r', bgColor: 'blue', textColor: 'white' }
            }
        ],
        allDaySlot: false,
        currentView: {
            viewType: 'dayGridMonth',
            from: '1701043200000',
            to: '1704672000000'
        },
        events,
        // eventsChildren: eventChild
    });

    const children = $('div', {style: { padding: '2em 0 2em 4em', width: '1000px', maxWidth: '100%' }}, calendar);

    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch),
        ctxToPath: () => '/test'
    };
    const ack: boolean | null = null;
    const branchKey = 'abc';
    const isRoot = true;

    return createSyncProviders({sender, ack, isRoot, branchKey, children});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);
ReactDOM.render($(App), containerElement);