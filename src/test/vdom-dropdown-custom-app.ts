import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../main/vdom-hooks";
import { DropdownCustom } from "../extra/DropdownCustom";

function App() {
    const children = $(DropdownCustom, {
        key: "TEST",
        identity: {parent: "test"},
        // value: string,
        content: [
            { color: '#43A047', text: 'LEGB' },
            'OPS HAMBURG',
            'OPS ST.PETERSBURG',
            { color: '#4db6ac', text: '45HC'},
        ],
        // popupChildren: ReactNode[]
        open: false,
    });
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch)
    };
    const ack: boolean | null = null;

    return createSyncProviders({sender, ack, children: [children]});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);
ReactDOM.render($(App), containerElement);