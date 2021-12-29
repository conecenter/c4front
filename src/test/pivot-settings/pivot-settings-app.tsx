import React from "react";
import {render} from "react-dom";
import {PivotField, PivotSettings, PivotSettingsProps} from "../../extra/pivot-settings/pivot-settings";
import {createSyncProviders} from "../../main/vdom-hooks";

function App() {
  function getFields(key: string): PivotField[] {
    return Array.from(Array(5).keys()).map((value) => ({id: `${key}-${value}`, name: `${key}-${value}`}))
  }

  const pivotProps: PivotSettingsProps = {
    // @ts-ignore
    identity: {parent: "test"},
    fields: getFields("fields"), pivotBreaks: [], pivotCells: [], pivotColumns: [], pivotData: [], pivotFilters: getFields("filters"), pivotRows: []
  }
  // @ts-ignore
  const children = (
    <div key="test" className="App" style={{height: "100%"}}>
        <PivotSettings {...pivotProps}/>
    </div>
  )
  const sender = {
    enqueue: (identity: any, patch: any) => console.log(patch)
  }
  const ack: boolean | null = null

  return createSyncProviders({sender, ack, children: [children]})
}

const rootElement = document.getElementById('root')
render(<App/>, rootElement)
