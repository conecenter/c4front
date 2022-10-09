import ReactDOM from "react-dom"
import React, { createElement as $ } from "react"
import { createSyncProviders } from "../../main/vdom-hooks";
import { VirtualKeyboard } from "../../extra/virtual-keyboard";


function App() {
    const child = $(VirtualKeyboard, {
        key: "TEST1",
        identity: {parent: "test"},
        position: 'bottom',
        keyboardTypes: [
            {
                name: 'number',
                modes: [
                    {
                        keys: [
                            { key: '7', row: 1, column: 1, width: 1, height: 1 },
                            { key: '8', row: 1, column: 2, width: 1, height: 1 },
                            { key: '9', row: 1, column: 3, width: 1, height: 1 },
                            { key: 'Backspace', symbol: '⌫', row: 1, column: 4, width: 1, height: 1 },
                            { key: '4', row: 2, column: 1, width: 1, height: 1 },
                            { key: '5', row: 2, column: 2, width: 1, height: 1 },
                            { key: '6', row: 2, column: 3, width: 1, height: 1 },
                            { key: 'C', row: 2, column: 4, width: 1, height: 1 },
                            { key: '1', row: 3, column: 1, width: 1, height: 1 },
                            { key: '2', row: 3, column: 2, width: 1, height: 1 },
                            { key: '3', row: 3, column: 3, width: 1, height: 1 },
                            { key: '0', row: 4, column: 1, width: 3, height: 1 },
                            { key: 'Enter', symbol: '⏎', row: 3, column: 4, width: 1, height: 2 },
                        ],
                        rowsTotal: 4,
                        colsTotal: 4
                    }
                ]
            }
        ]
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