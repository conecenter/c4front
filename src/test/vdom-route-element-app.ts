import ReactDOM from "react-dom"
import { createElement as $ } from "react"
import {createSyncProviders} from "../main/vdom-hooks";
import { RouteElement } from "../extra/route-element";


function App() {
    const child = $(RouteElement, {
        key: "TEST1",
        routeParts: []        
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