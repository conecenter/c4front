import ReactDOM from "react-dom"
import { createElement as $ } from "react"
import {createSyncProviders} from "../main/vdom-hooks";
import { RouteElement } from "../extra/route-element";


function App() {
    const child = $('div', {style: { margin: '3em', width: 'max-content' }}, $(RouteElement, {
        key: "TEST1",
        identity: {parent: "TEST_1"},
        compact: false,
        routeParts: [
            {
                text: '●',
                hint: 'hello world',
                done: true
            },
            {
                text: 'RUVVO➝RUMAG',
                hint: 'abc route part',
                done: true
            },
            {
                text: '●',
                hint: 'cargo movement',
                done: true
            },
            {
                text: 'RUMAG➝RUVVO',
                hint: 'cargo movement',
                done: false
            },
            {
                text: '●',
                hint: 'cargo movement',
                done: false
            }
        ]        
    }))
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch)
    }
    const ack: boolean | null = null

    return createSyncProviders({sender, ack, children: child})
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement) 