import ReactDOM from "react-dom"
import React from "react"
import { createSyncProviders } from "../main/vdom-hooks";
import { DropdownCustom } from "../extra/DropdownCustom";

const {createElement: $} = React

function App() {
    const children = $(DropdownCustom, {
        key: "TEST",
        identity: {parent: "test"}
    })
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch)
    }
    const ack: boolean | null = null

    return createSyncProviders({sender, ack, children: [children]})
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)