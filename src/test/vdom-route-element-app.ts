import ReactDOM from "react-dom"
import { createElement as $ } from "react"
import {createSyncProviders} from "../main/vdom-hooks";
import { RouteElement } from "../extra/route-element";


function App() {
    const child = $(RouteElement, {
        key: "TEST1",
        routeParts: [
            {
                text: '●',
                hint: 'hello world',
                done: true,
                onClick: () => console.log('click handler')
            },
            {
                text: 'RUVVO',
                hint: 'abc route part',
                done: false
            },
            {
                text: '➝',
                hint: 'cargo movement',
                done: false
            },
            {
                text: 'RUMAG',
                hint: 'cargo movement',
                done: false
            },
            {
                text: '➝',
                hint: 'cargo movement',
                done: false
            },
            {
                text: 'RUVVO',
                hint: 'cargo movement',
                done: false
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