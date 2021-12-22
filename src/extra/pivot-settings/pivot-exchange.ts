import {PivotField, PivotSettingsProps} from "./pivot-settings";
import {DATA_ID, PartNames} from "./pivot-const";
import {extend} from "immutability-helper";
import update from 'immutability-helper';
import {XYCoord} from "react-dnd/dist/types/types/monitors";

export interface PivotDragItem {
  dragOrigin: string
  item: PivotField
}

export type PivotDropAction = (event: PivotDragItem, dropLocation: string, dropCoordinates?: XYCoord | null) => void

export interface PivotDragEvent extends PivotDragItem {
  dropLocation: string,
  dropCoordinates?: XYCoord | null
}

extend('$rmField', function (item: PivotField, list: PivotField[]) {
  return list.filter((value) => value.id != item.id);
});

function getDataId(element: Element): string {
  return element.getAttribute(DATA_ID) || ""
}

interface ReorderCommand {
  side: "left" | "right"
  id: string
}

export function updateState(state: PivotSettingsProps, root: Element | undefined, event: PivotDragEvent): PivotSettingsProps {
  if (event.dragOrigin == event.dropLocation && event.dropCoordinates) { // Reorder
    const childrenList = root?.querySelector<HTMLDivElement>("." + event.dragOrigin)?.childNodes
    const children = childrenList ? [...childrenList] : []
    const dropXY = event.dropCoordinates
    let intersection: ReorderCommand | null = null
    children.map((node, index) => {
      const element = node as Element
      const box = element.getBoundingClientRect()
      if (box.top <= dropXY.y && dropXY.y <= box.bottom) {
        const boxCenter = (box.right - box.left) / 2 + box.left
        if (box.left <= dropXY.x && dropXY.x <= boxCenter)
          intersection = {side: "left", id: getDataId(element)}
        else if (boxCenter <= dropXY.x)
          intersection = {side: "right", id: getDataId(element)}
      }
    })
    // @ts-ignore
    if (intersection !== null && intersection.id !== event.item.id) {
      const draggedList = state[event.dragOrigin].filter((value) => value.id !== event.item.id)
      // @ts-ignore
      const targetInd = draggedList.findIndex((value) => value.id === intersection.id)
      // @ts-ignore
      const indexOffset = intersection.side === "left" ? 0 : 1
      draggedList.splice(targetInd + indexOffset, 0, event.item)
      return update(state, {[event.dragOrigin]: {$set: draggedList}})
    } else return state
  }

  if (event.dropLocation == PartNames.FIELDS) { // @ts-ignore // Remove field
    return update(state, {[event.dragOrigin]: {$rmField: event.item}})
  }

  if (event.dragOrigin == PartNames.FIELDS) { // Add field
    return update(state, {[event.dropLocation]: {$push: [event.item]}})
  }

  if (event.dragOrigin != event.dropLocation) { // @ts-ignore // Move field
    return update(state, {[event.dragOrigin]: {$rmField: event.item}, [event.dropLocation]: {$push: [event.item]}})
  }

  return state
}
