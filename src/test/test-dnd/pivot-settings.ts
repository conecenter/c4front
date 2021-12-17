import React, {Dispatch, SetStateAction, useState} from "react";
import {HTML5Backend} from "react-dnd-html5-backend";
import {DndProvider, useDrag, useDrop} from "react-dnd";
import {createElement as el} from "react";
import update from "immutability-helper";

export const ItemTypes = {
  FIELD: 'field',
  DIMENSION: 'dimension',
  FILTER: 'filter',
  DATA: 'data'
}

export interface PivotField {
  id: string,
  name: string,
}

export interface PivotFieldDrag {
  id: string,
  origin: string
  field: PivotField
}

export interface PivotSettingsProps {
  fields: PivotField[],
  filterFields: PivotField[]
  breakFields: PivotField[]
  rowFields: PivotField[]
  colFields: PivotField[]
  dataFields: PivotField[]
  cellFields: PivotField[],

  [key: string]: PivotField[],
}

export function PivotSettings(props: PivotSettingsProps) {
  const [state, setState] = useState<PivotSettingsProps>(props)
  return el("div", {className: "pivotSettings"},
    PivotSettingsPart("fields", "pivotFields", state.fields, setState),
    PivotSettingsPart("filterFields", "pivotFilters", state.filterFields, setState),
    PivotSettingsPart("breakFields", "pivotBreaks", state.breakFields, setState),
    PivotSettingsPart("rowFields", "pivotColumns", state.rowFields, setState),
    PivotSettingsPart("colFields", "pivotRows", state.colFields, setState),
    PivotSettingsPart("dataFields", "pivotData", state.dataFields, setState),
    PivotSettingsPart("cellFields", "pivotCells", state.cellFields, setState),
  )
}

export function PivotSettingsPart(key: string, className: string, fields: PivotField[], setState: Dispatch<SetStateAction<PivotSettingsProps>>) {
  function onDrop(item: PivotFieldDrag, prev: PivotSettingsProps): PivotSettingsProps {
    console.log(key, item, prev)
    if (item.origin == key) return prev
    else {
      const copy = [...prev.dataFields]
      const move = copy.pop()
      const copy2 = [...prev.cellFields, move ? move : {id: "new", name: "new"}]
      return {
        ...prev,
        dataFields: copy,
        cellFields: copy2,
      }
    }
  }

  const [{isOver, canDrop}, drop] = useDrop(() => ({
    accept: ItemTypes.FIELD,
    drop: (item: PivotFieldDrag) => setState((prev) => onDrop(item, prev)),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }))
  const style = isOver && canDrop ? {backgroundColor: "lightBlue"} : {}
  return el("div", {
      key: key,
      ref: drop,
      className: className,
      style: style
    },
    fields.map((value) => PivotField(key, value))
  )
}

export function PivotField(origin: string, field: PivotField) {
  const [{isDragging}, drag] = useDrag(() => ({
      type: ItemTypes.FIELD,
      item: {id: field.id, origin: origin, field: field},
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    })
  )
  const style = isDragging ? {opacity: 0} : {}
  return el("button", {
    key: field.id,
    ref: drag,
    className: "button",
    style: style
  }, field.name)
}
