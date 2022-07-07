import {useDrop} from "react-dnd";
import {isPivotFieldsGroup, PivotField, PivotFieldsGroup} from "./pivot-settings";
import {createElement as el} from "react";
import {PivotDragItem, PivotDropAction} from "./pivot-exchange";
import {ItemTypes, PartNames} from "./pivot-const";

interface PivotFieldsProps {
  fields: (PivotField | PivotFieldsGroup)[],
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
  const canDeleteClass = canDrop ? "pivotCanDelete" : ""
  return el("div", {
    key: PartNames.FIELDS,
    ref: drop,
    className: `${PartNames.FIELDS} ${canDeleteClass}`
  },
    el('span', null, 'Fields'),
    fields.map((item, index) => isPivotFieldsGroup(item)
      ? el(PivotFieldsGroup, {key: `${index}`, groupName: item.groupName, fields: item.fields, dropAction})
      : el(PivotField, {key: item.id, type: ItemTypes.FIELD, origin: PartNames.FIELDS, field: item, dropAction})
    )
  )
}
