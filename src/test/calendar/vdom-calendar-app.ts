import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import { Calendar } from "../../extra/calendar/calendar";
import { ButtonElement } from "../../extra/button-element";
import { SyncedPopup } from "../../extra/popup-elements/synced-popup";
import { PopupManager } from "../../extra/popup-elements/popup-manager";

function App() {
    const eventChild = [
        $(ButtonElement, {key: '1', value: '', path: '/button', className: 'yellowColorCss', onClick: () => console.log('clicked')}, 'Full calendar'),
        //$(SyncedPopup, {key: '2', identity: { key: 'popup' }}, 'Hello world')
    ];

    const calendar = $(Calendar, {
        identity: { key: 'test' },
        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: 28800000,
            endTime: 64800000
        },
        allDaySlot: false,
        currentView: {
            viewType: 'dayGridMonth',
            from: 1701043200000,
            to: 1704672000000
        },
        events: [
            {
                id: 'Meeting',
                title: 'Meeting',
                start: new Date(2023, 11, 20, 12).getTime(),
                end: new Date(2023, 11, 20, 14).getTime(),
                color: { tp: 'p', cssClass: 'primaryColorCss' },
                children: eventChild
            },
            {
                id: 'Meeting-2',
                title: 'Meeting-2',
                start: new Date(2023, 11, 21, 14).getTime(),
                end: new Date(2023, 11, 21, 16).getTime()
            },
            {
                id: 'Meeting-3',
                title: 'Meeting-3',
                start: new Date(2023, 11, 21, 14).getTime(),
                end: new Date(2023, 11, 21, 16).getTime()
            },
            {
                id: 'Car arrival',
                title: 'Car arrival',
                start: new Date(2023, 11, 21, 10).getTime(),
                end: new Date(2023, 11, 21, 14).getTime(),
                color: { tp: 'r', bgColor: 'grey', textColor: 'white' }
            },
            {
                id: 'Train departure',
                title: 'Train departure',
                start: new Date(2023, 11, 23).getTime(),
                allDay: true
            }
        ]
    });

    const children = $(PopupManager, null,
        $('div', {style: { padding: '2em 0 2em 4em', width: '1000px', maxWidth: '100%' }}, calendar)
    );

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