import ReactDOM from "react-dom"
import React, { createElement as $ } from "react"
import { createSyncProviders } from "../../main/vdom-hooks";
import { VirtualKeyboard } from "../../extra/virtual-keyboard";

interface KeyboardLayout {
    base: VKButtonData[],
    [name: string]: VKButtonData[]
}

interface VKButtonData {
    key: string,
    position: { 
        row: number,
        col: number, 
        width: number, 
        height: number
    },
    name?: string,
    className?: string
}

function App() {
    const child = $(VirtualKeyboard, {
        key: "TEST1",
        identity: {parent: "test"},
        keyboardTypes: {
            number: {
                base: [
                    { key: '7', position: { row: 1, col: 1, width: 1, height: 1 }},
                    { key: '8', position: { row: 1, col: 2, width: 1, height: 1 }},
                    { key: '9', position: { row: 1, col: 3, width: 1, height: 1 }},
                    { key: '⌫', position: { row: 1, col: 3, width: 1, height: 1 }},
                    { key: '4', position: { row: 2, col: 1, width: 1, height: 1 }},
                    { key: '5', position: { row: 2, col: 2, width: 1, height: 1 }},
                    { key: '6', position: { row: 2, col: 3, width: 1, height: 1 }},
                    { key: 'C', position: { row: 2, col: 4, width: 1, height: 1 }},
                    { key: '1', position: { row: 3, col: 1, width: 1, height: 1 }},
                    { key: '2', position: { row: 3, col: 2, width: 1, height: 1 }},
                    { key: '3', position: { row: 3, col: 3, width: 1, height: 1 }},
                    { key: '0', position: { row: 4, col: 1, width: 3, height: 1 }},
                    { key: '⏎', position: { row: 3, col: 4, width: 1, height: 2 }},
                ]
            }
        }
    })
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch)
    }
    const ack: boolean | null = null

    return createSyncProviders({sender, ack, children: child})
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)