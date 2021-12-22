import React from "react";
import {render} from "react-dom";
import {PivotField, PivotSettings, PivotSettingsProps} from "../../extra/pivot-settings/pivot-settings";

const {createElement: $} = React

function App() {
  function getFields(key: string): PivotField[] {
    return Array.from(Array(5).keys()).map((value) => ({id: `${key}-${value}`, name: `${key}-${value}`}))
  }

  const pivotProps: PivotSettingsProps = {
    fields: getFields("fields"), pivotBreaks: [], pivotCells: [], pivotColumns: [], pivotData: [], pivotFilters: getFields("filters"), pivotRows: []
  }
  return (
    <div className="App" style={{height: "100%"}}>
        <PivotSettings {...pivotProps}/>
    </div>
  )
}

const rootElement = document.getElementById('root')
render(<App/>, rootElement)
