import ReactDOM from "react-dom"
import React from "react"
import {createSyncProviders} from "../main/vdom-hooks";
import {DatePickerInputElement} from "../main/datepicker";

const {createElement: $} = React

function App() {
    const testTS = 1609459200000
    console.log(testTS)
    const children = $(DatePickerInputElement, {
        key: "TEST",
        serverState: {
            timestamp:  testTS,
            timestampFormat: "dd/MM/yyyy HH:mm",
            timezoneId: "Europe/Moscow"
        },
        localState: {
            currentTimestamp: testTS,
            currentInput: "ololo",
            open: false
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