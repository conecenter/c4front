import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import { Calendar } from "../../extra/calendar";

function App() {
    const children = $('div', { style: { paddingLeft: '4em', width: '1000px', maxWidth: '100%' } },
        $(Calendar, {
            //identity: { key: 'test' },
            events: [
                {
                  title: 'Car arrival',
                  start: new Date(2023, 11, 24, 10).getTime(),
                  end: new Date(2023, 11, 24, 14).getTime()
                },
                {
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