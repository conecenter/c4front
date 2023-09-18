import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../main/vdom-hooks";
import { FlagElement } from "../extra/flag-element";

function App() {
    const child = $('div', {style: { maxWidth: '300px', margin: '2em', fontSize: '2.5em' }},
        $(FlagElement, {
            identity: { key: 'test' },
            imageSrc: './images/denmark.svg',
            name: 'DK'
        })
    );
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch),
        ctxToPath: () => '/test'
    };
    const ack: boolean | null = null;
    const isRoot = true;

    return createSyncProviders({sender, ack, isRoot, children: child});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);
ReactDOM.render($(App), containerElement);