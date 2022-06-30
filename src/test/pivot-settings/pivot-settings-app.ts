import {createElement as el} from "react";
import {render} from "react-dom";
import {PivotField, PivotSettings, PivotSettingsProps} from "../../extra/pivot-settings/pivot-settings";
import {createSyncProviders} from "../../main/vdom-hooks";

function App() {
    function getFields(key: string): PivotField[] {
        return Array.from(Array(5).keys()).map((value) =>  ({id: `${key}-${value}`, name: `${key}-${value}`, selected: false, invalid: value === 3 ? true : false}))
    }

    const pivotProps: PivotSettingsProps = {
        // @ts-ignore
        identity: {parent: "test"},
        fields: getFields("fields"),
        pivotBreaks: [],
        pivotCells: [],
        pivotColumns: [],
        pivotData: [],
        pivotFilters: getFields("filters"),
        pivotRows: []
    }
    // @ts-ignore
    const children = el("div", {key: "test", className: "App", style: {height: "100%"}},
        el(PivotSettings, pivotProps)
    )
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch)
    }
    const ack: boolean | null = null

    return createSyncProviders({sender, ack, children: [children]})
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
render(el(App), containerElement)
