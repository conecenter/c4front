import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../main/vdom-hooks";
import { DropdownCustom } from "../extra/dropdown-custom";

function App() {
    const child1 = $(DropdownCustom, {
        key: "TEST1",
        identity: {parent: "test"},
        state: {
            inputValue: '45 LEGB [45 9 6]',
            mode: 'content',
            popupOpen: ''
        },
        content: [
            { color: '#43A047', text: 'LEGB' },
            { text: 'OPS HAMBURG' },
            { text: 'OPS ST.PETERSBURG' },
            { color: '#4db6ac', text: '45HC'},
        ],
        popupChildren: [
            $('p', { key: 'popupChild1' }, 'Hello World'),
            $('p', { key: 'popupChild2' }, 'Overlanded'),
            $('input', { key: 'popupChild3' })
        ],
        popupClassname: 'popupClassname'
    });
    const child2 = $(DropdownCustom, {
        key: "TEST2",
        identity: {parent: "test"},
        state: {
            inputValue: '45 LEGB [45 9 6]',
            mode: 'content',
            popupOpen: ''
        },
        content: [
            { color: '#43A047', text: 'LEGB' },
            { text: 'OPS HAMBURG' },
            { text: 'OPS ST.PETERSBURG' },
            { color: '#4db6ac', text: '45HC'},
        ],
        popupChildren: [
            $('p', { key: 'popupChild1' }, 'Hello World'),
            $('p', { key: 'popupChild2' }, 'Overlanded')
        ]
    });
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch)
    };
    const ack: boolean | null = null;

    return createSyncProviders({sender, ack, children: [child1, child2]});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);
ReactDOM.render($(App), containerElement);