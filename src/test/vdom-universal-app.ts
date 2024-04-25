import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../main/vdom-hooks";
import { ScalingElement } from "../extra/scaling-element";

function App() {
    const child = $('div', { style: { display: 'flex', flexDirection: 'column' }},
        $(ScalingElement, { scale: 3 },
            $('span', null, 'Hello, world!'),
            $('span', null, 'Hello, world!')
        )
    );
    const sender = {
        enqueue: (identity: object, patch: any) => console.log(patch),
        ctxToPath: () => '/test'
    };
    const ack: boolean | null = null;
    const branchKey = 'abc';
    const isRoot = true;

    return createSyncProviders({sender, ack, branchKey, isRoot, children: child});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);
ReactDOM.render($(App), containerElement);