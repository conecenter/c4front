import ReactDOM from "react-dom"
import React from "react"
import {createSyncProviders} from "../../main/vdom-hooks";
import { TimePicker } from "../../extra/timepicker/timepicker";

const {createElement: $} = React

function App() {
    const children = $(TimePicker, {
        key: "TEST",
        identity: {parent: "test"},
        timeFormatId: 0,
        state: {
            tp: 'timestring-state',
            time: '00:00'
        }
    });
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch)
    }
    const ack: boolean | null = null

    return createSyncProviders({sender, ack, children: [children]})
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)