import ReactDOM from "react-dom"
import React, { createElement as $ } from "react"
import { createSyncProviders } from "../../main/vdom-hooks";
import { VirtualKeyboard } from "../../extra/virtual-keyboard";

function App() {
    const child = $(VirtualKeyboard, {
        key: "TEST1",
        identity: {parent: "test"},
        keyboardTypes: {
            number: {
                base: {
                    rowsTotal: 4,
                    colsTotal: 4,
                    buttons: [
                        { keyCode: '7', position: { row: 1, column: 1, width: 1, height: 1 }},
                        { keyCode: '8', position: { row: 1, column: 2, width: 1, height: 1 }},
                        { keyCode: '9', position: { row: 1, column: 3, width: 1, height: 1 }},
                        { keyCode: '⌫', position: { row: 1, column: 4, width: 1, height: 1 }},
                        { keyCode: '4', position: { row: 2, column: 1, width: 1, height: 1 }},
                        { keyCode: '5', position: { row: 2, column: 2, width: 1, height: 1 }},
                        { keyCode: '6', position: { row: 2, column: 3, width: 1, height: 1 }},
                        { keyCode: 'C', position: { row: 2, column: 4, width: 1, height: 1 }},
                        { keyCode: '1', position: { row: 3, column: 1, width: 1, height: 1 }},
                        { keyCode: '2', position: { row: 3, column: 2, width: 1, height: 1 }},
                        { keyCode: '3', position: { row: 3, column: 3, width: 1, height: 1 }},
                        { keyCode: '0', position: { row: 4, column: 1, width: 3, height: 1 }},
                        { keyCode: '⏎', position: { row: 3, column: 4, width: 1, height: 2 }},
                    ]
                }
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