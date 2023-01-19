import ReactDOM from "react-dom"
import React from "react"
import {createSyncProviders} from "../../main/vdom-hooks";
import { TimePicker } from "../../extra/timepicker/timepicker";

const {createElement: $} = React

function App() {
    const children = $('div', {key: 'wrapper', style: {width: 'max-content', margin: '7em auto'}},
        $(TimePicker, {
            key: "TEST",
            identity: {parent: "test"},
            state: {
                tp: 'timestring-state',
                timestamp: 86350000
            }
    }));
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch)
    }
    const ack: boolean | null = null

    return createSyncProviders({sender, ack, children: [children]})
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)