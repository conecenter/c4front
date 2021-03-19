import ReactDOM from "react-dom"
import React from "react"
import {DatePickerInputElement} from "../main/vdom-datepicker";
import {createSyncProviders} from "../main/vdom-hooks";
import {Month, WeekDay, Locale, DefaultLocale} from "../main/locale";

const {createElement: $} = React

function App() {
    const children = $(DatePickerInputElement, {
        key: "TEST",
        timestamp: 1615990956 * 1000,
        timestampFormat: "dd/MM/yyyy HH:mm",
        locale: DefaultLocale
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