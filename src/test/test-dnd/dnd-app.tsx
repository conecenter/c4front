import React from "react";
import {render} from "react-dom";
import {HTML5Backend} from "react-dnd-html5-backend";
import {DndProvider} from "react-dnd";
import {Container, TakeContainer} from "./container";
import {PivotField, PivotSettings, PivotSettingsProps} from "./pivot-settings";

const {createElement: $} = React

function App() {
  function getFields(key: string): PivotField[] {
    return Array.from(Array(2).keys()).map((value) => ({id: `${key}-${value}`, name: `${key}-${value}`}))
  }
  const pivotProps: PivotSettingsProps = {
    fields: getFields("fields"),
    breakFields: getFields("breakFields"),
    cellFields: getFields("cellFields"),
    colFields: getFields("colFields"),
    dataFields: getFields("dataFields"),
    filterFields: getFields("filterFields"),
    rowFields: getFields("rowFields"),
  }
  return (
    <DndProvider backend={HTML5Backend}>
    <div className="App" style={{height: "100vh"}}>
        <PivotSettings {...pivotProps}/>
    </div>
    </DndProvider>
  )
}

const rootElement = document.getElementById('root')
render(<App/>, rootElement)
