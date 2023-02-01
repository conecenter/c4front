import ReactDOM from "react-dom"
import React from "react"
import {createSyncProviders} from "../../main/vdom-hooks";
import { TimePicker } from "../../extra/timepicker/timepicker";
import { PopupManager } from "../../extra/popup-elements/popup-manager";

const {createElement: $} = React

function App() {
    const children = $('div', {key: 'wrapper', style: {width: 'max-content', margin: '7em auto'}},
        $(TimePicker, {
            key: "TEST",
            identity: {parent: { key: "test" }},
            state: {
                tp: 'timestamp-state',
                timestamp: 3600000
            },
            timestampFormatId: 2,
            readonly: false
            // offset: 3600000
    }));
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch)
    }
    const ack: boolean | null = null

    return createSyncProviders({sender, ack, children: 
        $(PopupManager, null, [children])
    })
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)