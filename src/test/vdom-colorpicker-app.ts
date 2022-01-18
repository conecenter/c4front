import ReactDOM from "react-dom"
import React from "react"
import {createSyncProviders} from "../main/vdom-hooks";
import { ColorPicker } from "../extra/ColorPicker";

const {createElement: $} = React

function App() {
    const child1 = $(ColorPicker, {
        key: "TEST",
        identity: {parent: "test"},
        ro: false,
        value: '#ff0000'
    })
    const child2 = $(ColorPicker, {
        key: "TEST2",
        identity: {parent: "test"},
        ro: true,
        value: ''
    })
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch)
    }
    const ack: boolean | null = null

    return createSyncProviders({sender, ack, children: [child1, child2]})
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)