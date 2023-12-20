import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import { Calendar } from "../../extra/calendar";

function App() {
    const children = $('div', { style: { paddingLeft: '4em', height: '50em' } },
        $(Calendar, {
            //identity: { key: 'test' },
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