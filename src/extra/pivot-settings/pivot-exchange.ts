import {PivotField, PivotSettingsProps} from "./pivot-settings";
import {PartNames} from "./pivot-const";
import {extend} from "immutability-helper";
import update from 'immutability-helper';
import {XYCoord} from "react-dnd/dist/types/types/monitors";

export interface PivotDragItem {
  dragOrigin: string
  item: PivotField
}

export type PivotDropAction = (event: PivotDragItem, dropLocation: string, dropCoordinates?: XYCoord | null) => void

export interface PivotDragEvent extends PivotDragItem{
  dropLocation: string,
  dropCoordinates?:XYCoord | null
}

extend('$rmField', function(item: PivotField, list: PivotField[]) {
  return list.filter((value) => value.id != item.id);
});

export function updateState(state: PivotSettingsProps,root: Element|undefined, event: PivotDragEvent): PivotSettingsProps {
  if (event.dragOrigin == event.dropLocation) {
    console.log(event.dropCoordinates, root?.querySelector<HTMLDivElement>("." + event.dragOrigin)?.childNodes)
    return state // todo
  }

  if (event.dropLocation == PartNames.FIELDS)
    { // @ts-ignore
      return update(state, {[event.dragOrigin]:{$rmField:event.item}})
    }

  if (event.dragOrigin == PartNames.FIELDS) {
    return update(state, {[event.dropLocation]: {$push: [event.item]}})
  }

  return state
}
