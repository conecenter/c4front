import {PivotField, PivotSettingsProps, PivotSettingsState} from "./pivot-settings";
import {DATA_ID, PartNames} from "./pivot-const";
import update, {extend} from "immutability-helper";
import {XYCoord} from "react-dnd/dist/types/types/monitors";
import {Patch, PatchHeaders} from "../exchange/patch-sync";

type PivotChangeType = "reorder" | "move" | "add" | "remove" | "noop"

interface PivotChangeCommon {
    tp: PivotChangeType
}

interface Reorder extends PivotChangeCommon {
    tp: "reorder"
    in: string
    targetId: string
    dropLeft: boolean
    draggedItemId: string
}

interface Move extends PivotChangeCommon {
    tp: "move"
    from: string
    to: string
    draggedItemId: string
}

interface Add extends PivotChangeCommon {
    tp: "add"
    to: string
    draggedItemId: string
}

interface Remove extends PivotChangeCommon {
    tp: "remove"
    from: string
    draggedItemId: string
}

interface NoAction extends PivotChangeCommon {
    tp: "noop"
}

type PivotChange = Reorder | Move | Add | Remove | NoAction

const pivotServerStateToState: (s: PivotSettingsProps) => PivotSettingsState = s => ({
    fields: s.fields,
    pivotFilters: s.pivotFilters,
    pivotBreaks: s.pivotBreaks,
    pivotRows: s.pivotRows,
    pivotColumns: s.pivotColumns,
    pivotData: s.pivotData,
    pivotCells: s.pivotCells
})

function getHeaders(ch: PivotChange): PatchHeaders {
    switch (ch.tp) {
        case "add":
            return {
                "x-r-to": ch.to,
                "x-r-dragged-id": ch.draggedItemId
            }
        case "remove":
            return {
                "x-r-from": ch.from,
                "x-r-dragged-id": ch.draggedItemId
            }
        case "move":
            return {
                "x-r-from": ch.from,
                "x-r-to": ch.to,
                "x-r-dragged-id": ch.draggedItemId
            }
        case "reorder":
            return {
                "x-r-in": ch.in,
                "x-r-target-id": ch.targetId,
                "x-r-drop-left": ch.dropLeft ? "1" : "",
                "x-r-dragged-id": ch.draggedItemId
            }
        default :
            return {}
    }
}

const pivotChangeToState: (ch: PivotChange) => Patch = ch => {
    return {
        headers: getHeaders(ch),
        value: ch.tp
    }
}

const su: (su: string | undefined) => string = s => s ? s : ""

const patchToPivotChange: (p: Patch) => PivotChange = p => {
    switch (p.value) {
        case "add":
            return {
                tp: "add",
                to: su(p.headers?.["x-r-to"]),
                draggedItemId: su(p.headers?.["x-r-dragged-id"])
            }
        case "remove":
            return {
                tp: "remove",
                from: su(p.headers?.["x-r-from"]),
                draggedItemId: su(p.headers?.["x-r-dragged-id"])
            }
        case "move":
            return {
                tp: "move",
                from: su(p.headers?.["x-r-from"]),
                to: su(p.headers?.["x-r-to"]),
                draggedItemId: su(p.headers?.["x-r-dragged-id"])
            }
        case "reorder":
            return {
                tp: "reorder",
                in: su(p.headers?.["x-r-in"]),
                targetId: su(p.headers?.["x-r-target-id"]),
                dropLeft: !!p.headers?.["x-r-drop-left"],
                draggedItemId: su(p.headers?.["x-r-dragged-id"])
            }
        default:
            return {tp: "noop"}
    }
}

function iua<Item>(iu: Item | undefined): Item[] {
    if (iu === undefined) return []
    else return [iu]
}

function find(id: string, list: PivotField[]): PivotField[] {
    return iua(list.find((item) => item.id === id))
}

extend('$filterOut', function (itemId: string, list: PivotField[]) {
    return list.filter((value) => value.id != itemId);
});

const applyPivotChange: (prev: PivotSettingsState, ch: PivotChange) => PivotSettingsState = (prev, ch) => {
    switch (ch.tp) {
        case "add":
            return update(prev, {[ch.to]: {$push: find(ch.draggedItemId, prev.fields)}})
        case "remove":
            // @ts-ignore
            return update(prev, {[ch.from]: {$filterOut: ch.draggedItemId}})
        case "move":
            // @ts-ignore
            return update(prev, {
                [ch.from]: {$filterOut: ch.draggedItemId},
                [ch.to]: {$push: find(ch.draggedItemId, prev[ch.from])}
            })
        case "reorder":
            const item = find(ch.draggedItemId, prev[ch.in])
            // @ts-ignore
            const draggedList = update(prev[ch.in], {$filterOut: ch.draggedItemId})
            const targetInd = draggedList.findIndex((value) => value.id === ch.targetId)
            const indexOffset = ch.dropLeft ? 0 : 1
            draggedList.splice(targetInd + indexOffset, 0, ...item)
            return update(prev, {[ch.in]: {$set: draggedList}})
        default:
            return prev
    }
}

export interface PivotDragItem {
    dragOrigin: string
    item: PivotField
}

export type PivotDropAction = (event: PivotDragItem, dropLocation: string, dropCoordinates?: XYCoord | null, temporary?: boolean) => void

export interface PivotDragEvent extends PivotDragItem {
    dropLocation: string,
    dropCoordinates?: XYCoord | null
}

function getDataId(element: Element): string {
    return element.getAttribute(DATA_ID) || ""
}

interface ReorderCommand {
    dropLeft: boolean
    id: string
}

const NO_OP: NoAction = {tp: "noop"}

function getPivotChange(state: PivotSettingsState, root: Element | undefined, event: PivotDragEvent, temporary?: boolean): PivotChange {
    if (event.dragOrigin == event.dropLocation && event.dropCoordinates && temporary) { // Reorder
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
                    intersection = {dropLeft: true, id: getDataId(element)}
                else if (boxCenter <= dropXY.x)
                    intersection = {dropLeft: false, id: getDataId(element)}
            }
        })
        // @ts-ignore
        if (intersection !== null && intersection.id !== event.item.id) {
            const reorderEvent = intersection as ReorderCommand
            const itemInd = state[event.dragOrigin].findIndex(item => item.id === event.item.id)
            // @ts-ignore
            const targetInd = update(state[event.dragOrigin], {$filterOut: event.item.id}).findIndex((value) => value.id === reorderEvent.id)
            const indexOffset = reorderEvent.dropLeft ? 0 : 1
            if (itemInd === targetInd + indexOffset) return NO_OP
            else return {
                tp: "reorder",
                in: event.dragOrigin,
                targetId: reorderEvent.id,
                dropLeft: reorderEvent.dropLeft,
                draggedItemId: event.item.id
            }
        } else return NO_OP
    }
    if (!temporary) {
        if (event.dropLocation == PartNames.FIELDS) { // @ts-ignore // Remove field
            return {
                tp: "remove",
                from: event.dragOrigin,
                draggedItemId: event.item.id
            }
        }

        if (event.dragOrigin == PartNames.FIELDS) { // Add field
            return {
                tp: "add",
                to: event.dropLocation,
                draggedItemId: event.item.id
            }
        }

        if (event.dragOrigin != event.dropLocation) { // @ts-ignore // Move field
            return {
                tp: "move",
                from: event.dragOrigin,
                to: event.dropLocation,
                draggedItemId: event.item.id
            }
        }
    }

    return NO_OP
}

export {applyPivotChange, patchToPivotChange, pivotChangeToState, pivotServerStateToState, getPivotChange}