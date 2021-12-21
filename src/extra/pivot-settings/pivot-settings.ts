import {createElement as el, useCallback, useRef, useState} from "react";
import {useDrag, useDrop} from "react-dnd";
import {PivotFields} from "./pivot-fields";
import {PivotDragItem, PivotDropAction, updateState} from "./pivot-exchange";
import {ItemTypes} from "./pivot-const";


export interface PivotField {
  id: string,
  name: string,
}

export interface aaa {
  data: PivotSettingsProps
}

export interface PivotSettingsProps {
  fields: PivotField[],
  pivotFilters: PivotField[]
  pivotBreaks: PivotField[]
  pivotRows: PivotField[]
  pivotColumns: PivotField[]
  pivotData: PivotField[]
  pivotCells: PivotField[],

  [key: string]: PivotField[],
}

export function PivotSettings(props: aaa) {
  const [state, setState] = useState<PivotSettingsProps>(props.data)
  const ref = useRef()
  const dropAction: PivotDropAction = useCallback((event: PivotDragItem, dropLocation: string, dropCoordinates) => {
    return setState(prev => updateState(prev, ref?.current,{...event, dropLocation, dropCoordinates}));
  }, [setState])
  return el("div", {ref, className: "pivotSettings"},
    el(PivotFields, {fields: state.fields, dropAction}),
    el(PivotSettingsPart, {key: "filterFields", className: "pivotFilters", state, dropAction}),
    el(PivotSettingsPart, {key: "breakFields",  className: "pivotBreaks", state, dropAction}),
    el(PivotSettingsPart, {key: "rowFields",  className: "pivotColumns", state, dropAction}),
    el(PivotSettingsPart, {key: "colFields", className: "pivotRows", state, dropAction}),
    el(PivotSettingsPart, {key: "dataFields",  className: "pivotData", state, dropAction}),
    el(PivotSettingsPart, {key: "cellFields", className: "pivotCells", state, dropAction})
  )
}

interface PivotSettingsPartProps {
  className: string,
  state: PivotSettingsProps,
  dropAction:PivotDropAction,
}

export function PivotSettingsPart({className, state, dropAction}: PivotSettingsPartProps) {
  const [{canDrop}, drop] = useDrop(() => ({
    accept: [ItemTypes.FIELD, ItemTypes.FILTER],
    drop: (item: PivotDragItem, monitor) => {
      dropAction(item, className, monitor.getClientOffset())
    },
    collect: (monitor) => ({
      canDrop: monitor.canDrop()
    })
  }),[className, dropAction])
  const style = canDrop ? {backgroundColor: "lightBlue"} : {}
  return el("div", {
      key: className,
      ref: drop,
      className: className,
      style: style
    },
    state[className].map((value) => el(PivotField, {key: value.id, type: ItemTypes.FILTER, origin: className, field: value}))
  )
}

interface PivotFieldProps {
  origin: string,
  type: string,
  field: PivotField
}

export function PivotField({origin, type, field}: PivotFieldProps) {
  const [{isDragging}, drag] = useDrag(() => ({
      type: type,
      item: {dragOrigin: origin, item: field},
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    })
  )
  const style = isDragging ? {opacity: 0} : {}
  return el("button", {
    key: field.id,
    "data-id": field.id,
    ref: drag,
    className: "button",
    style: style
  }, field.name)
}
