import ReactDOM from "react-dom"
import React from "react"
import {createSyncProviders} from "../main/vdom-hooks";
import {DatePickerInputElement} from "../extra/datepicker/datepicker";

const {createElement: $} = React

function App() {
    const testTS = 1609459200000 // Friday, 1 January 2021 00:00:00
    console.log(testTS)
    const children = $(DatePickerInputElement, {
        key: "TEST",
        timestampFormatId: 0,
        userTimezoneId: "Europe/Moscow",
        state: {
            type: "timestamp-state",
            timestamp: testTS
        }
    })
    const sender = {
        enqueue: (handlerName: any, patch: any) => console.log(patch)
    }
    const ack = null

    return createSyncProviders({sender, ack, children: [children]})
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)