import ReactDOM from "react-dom"
import React from "react"
import {createSyncProviders} from "../main/vdom-hooks";
import {DatePickerInputElement, DatePickerTest} from "../main/datepicker/datepicker";

const {createElement: $} = React

function App() {
    const testTS = 1609459200000 // Friday, 1 January 2021 00:00:00
    console.log(testTS)
    const children = $(DatePickerInputElement, {
        key: "TEST",
        timestampFormat: "dd/MM/yyyy HH:mm",
        userTimezoneId: "Europe/Moscow",
        state: {
            type: "timestamp-state",
            timestamp: testTS
        }
    })
    const testChild = $(DatePickerTest, {key: "test2", fromServerTimeStamp: testTS})
    const sender = {
        enqueue: (handlerName: any, patch: any) => console.log(patch)
    }
    const ack = null

    return createSyncProviders({sender, ack, children: [children, testChild]})
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)