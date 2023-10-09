import ReactDOM from "react-dom";
import { createElement as $, ReactNode } from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import { NumberFormattingInput } from '../../extra/number-formatting-input';

function App() {
    const child = $('div', {style: { maxWidth: '300px', padding: '2em' }},
        $(NumberFormattingInput, {
            identity: { key: 'test' },
            state: { number: '' },
            showThousandSeparator: true,
            scale: 2,
            minFraction: 2
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