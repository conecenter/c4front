import {useDrop} from "react-dnd";
import {PivotField} from "./pivot-settings";
import {createElement as el} from "react";
import {extend} from "immutability-helper";
import {PivotDragItem, PivotDropAction} from "./pivot-exchange";
import {ItemTypes, PartNames} from "./pivot-const";

interface PivotFieldsProps {
  fields: PivotField[],
  dropAction: PivotDropAction
}

export function PivotFields({fields, dropAction}: PivotFieldsProps) {
  const [{canDrop}, drop] = useDrop(() => ({
    accept: [ItemTypes.FILTER, ItemTypes.DATA, ItemTypes.DIMENSION],
    drop: (item: PivotDragItem) => {
      dropAction(item, PartNames.FIELDS)
    },
    collect: (monitor) => ({
      canDrop: monitor.canDrop(),
    })
  }))
  const style = canDrop ? {backgroundColor: "#fa6f7c"} : {}
  return el("div", {
    key: PartNames.FIELDS,
    ref: drop,
    className: PartNames.FIELDS,
    style: style
  },
    fields.map((value) => el(PivotField, {key: value.id,type: ItemTypes.FIELD, origin: PartNames.FIELDS, field: value, dropAction}))
    )
}
