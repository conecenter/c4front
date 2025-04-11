import ReactDOM from "react-dom"
import { createElement as $ } from "react"
import {createSyncProviders} from "../main/vdom-hooks";
import { SegmentedChip } from "../extra/segmented-chip";


function App() {
    const child = $('div', {style: { margin: '3em', width: 'max-content' }}, $(SegmentedChip, {
        key: "TEST1",
        identity: {parent: "TEST_1"},
        compact: false,
        routeParts: []  
    }))
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch)
    }
    const ack: boolean | null = null
    const isRoot = true

    return createSyncProviders({sender, ack, isRoot, children: child})
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement) 