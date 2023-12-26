import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import { Calendar } from "../../extra/calendar";
import { ButtonElement } from "../../extra/button-element";

function App() {
    const eventChild = $(ButtonElement,
        { value: '', className: 'yellowColorCss', onClick: () => console.log('clicked') },
        'Full calendar'
    );

    const children = $('div', { style: { paddingLeft: '4em', width: '1000px', maxWidth: '100%' } },
        $(Calendar, {
            identity: { key: 'test' },
            businessHours: {
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: 28800000,
                endTime: 64800000
            },
            allDaySlot: false,
            events: [
                {
                    id: 'Meeting',
                    title: 'Meeting',
                    start: new Date(2023, 11, 24, 12).getTime(),
                    end: new Date(2023, 11, 24, 14).getTime(),
                    color: { tp: 'p', cssClass: 'primaryColorCss' },
                    children: eventChild
                },
                {
                    id: 'Meeting-2',
                    title: 'Meeting-2',
                    start: new Date(2023, 11, 22, 14).getTime(),
                    end: new Date(2023, 11, 22, 16).getTime(),
                    
                },
                {
                    id: 'Meeting-3',
                    title: 'Meeting-3',
                    start: new Date(2023, 11, 24, 14).getTime(),
                    end: new Date(2023, 11, 24, 16).getTime()
                },
                {
                    id: 'Car arrival',
                    title: 'Car arrival',
                    start: new Date(2023, 11, 24, 10).getTime(),
                    end: new Date(2023, 11, 24, 14).getTime(),
                    color: { tp: 'r', bgColor: 'grey', textColor: 'white' }
                },
                {
                    id: 'Train departure',
                    title: 'Train departure',
                    start: new Date(2023, 11, 23).getTime(),
                    allDay: true
                }
            ]
        })
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