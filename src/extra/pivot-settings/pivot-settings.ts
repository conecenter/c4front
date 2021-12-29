import {createElement as el, ReactNode, useCallback, useMemo, useRef, useState} from "react";
import {DndProvider, useDrag, useDrop} from "react-dnd";
import {PivotFields} from "./pivot-fields";
import {
    PivotDragItem,
    PivotDropAction,
    getPivotChange,
    pivotServerStateToState,
    pivotChangeToState, patchToPivotChange, applyPivotChange
} from "./pivot-exchange";
import {ItemTypes} from "./pivot-const";
import {HTML5Backend} from "react-dnd-html5-backend";
import {XYCoord} from "react-dnd/lib";
import {usePatchSync} from "../exchange/patch-sync";


export interface PivotField {
    id: string,
    name: string
}

export interface PivotSettingsState {
    fields: PivotField[],
    pivotFilters: PivotField[]
    pivotBreaks: PivotField[]
    pivotRows: PivotField[]
    pivotColumns: PivotField[]
    pivotData: PivotField[]
    pivotCells: PivotField[],

    [key: string]: PivotField[],
}

export interface PivotSettingsProps extends PivotSettingsState {
    // @ts-ignore
    identity: Object
}

export function PivotSettings(props: PivotSettingsProps) {
    return el(DndProvider, {backend: HTML5Backend},
        el(PivotSettingsInner, {...props})
    )
}

function PivotSettingsInner(props: PivotSettingsProps) {
    const {currentState: state, sendTempChange,sendFinalChange} = usePatchSync(
        props.identity,
        'receiver',
        props,
        false,
        pivotServerStateToState,
        pivotChangeToState,
        patchToPivotChange,
        applyPivotChange
    )
    const ref = useRef()
    const dropAction: PivotDropAction = useCallback((event: PivotDragItem, dropLocation: string, dropCoordinates?: XYCoord | null, temporary?: boolean) => {
        const change = getPivotChange(state, ref?.current, {...event, dropLocation, dropCoordinates}, temporary)
        if (change.tp === "noop") return
        else if (temporary) sendTempChange(change)
        else sendFinalChange(change)
    }, [state])
    return el("div", {ref, className: "pivotSettings"},
        el(PivotFields, {fields: state.fields, dropAction}),
        el(PivotSettingsPart, {
            key: "filterFields",
            className: "pivotFilters",
            state,
            dropAction,
            accepts: ItemTypes.FILTER
        }),
        el(PivotSettingsPart, {
            key: "breakFields",
            className: "pivotBreaks",
            state,
            dropAction,
            accepts: ItemTypes.DIMENSION
        }),
        el(PivotSettingsPart, {
            key: "rowFields",
            className: "pivotColumns",
            state,
            dropAction,
            accepts: ItemTypes.DIMENSION
        }),
        el(PivotSettingsPart, {
            key: "colFields",
            className: "pivotRows",
            state,
            dropAction,
            accepts: ItemTypes.DIMENSION
        }),
        el(PivotSettingsPart, {key: "dataFields", className: "pivotData", state, dropAction, accepts: ItemTypes.DATA}),
        el(PivotSettingsPart, {
            key: "cellFields",
            className: "pivotCells",
            state,
            dropAction,
            accepts: ItemTypes.DIMENSION
        })
    )
}

interface PivotSettingsPartProps {
    className: string,
    state: PivotSettingsState,
    dropAction: PivotDropAction,
    accepts: string
}

function PivotSettingsPart({className, state, dropAction, accepts}: PivotSettingsPartProps) {
    const [{canDrop}, drop] = useDrop(() => ({
        accept: [ItemTypes.FIELD, accepts],
        drop: (item: PivotDragItem, monitor) => {
            dropAction(item, className, monitor.getClientOffset())
        },
        collect: (monitor) => ({
            canDrop: monitor.canDrop()
        })
    }), [className, dropAction])
    const canDropClass = canDrop ? "pivotCanDrop" : ""
    return el("div", {
            key: className,
            ref: drop,
            className: `${className} ${canDropClass}`,
        },
        state[className].map((value) => el(PivotField, {
            key: value.id,
            type: accepts,
            origin: className,
            field: value,
            dropAction
        }))
    )
}

interface PivotFieldProps {
    origin: string,
    type: string,
    field: PivotField,
    dropAction: PivotDropAction
}

export function PivotField({origin, type, field, dropAction}: PivotFieldProps) {
    const accepts = type !== ItemTypes.FIELD ? [type] : []
    const [{}, drop] = useDrop({
        accept: accepts,
        hover(item: PivotDragItem, monitor) {
            dropAction(item, origin, monitor.getClientOffset(), true)
        }
    })
    const [{isDragging}, drag] = useDrag(() => ({
            type: type,
            item: {dragOrigin: origin, item: field},
            collect: (monitor) => ({
                isDragging: monitor.isDragging()
            }),
        })
    )
    const draggedElementClass = isDragging ? "pivotDraggedElement" : ""
    return el("button", {
        key: field.id,
        "data-id": field.id,
        ref: (ref) => drag(drop(ref)),
        className: `pivotButton ${draggedElementClass}`,
    }, field.name)
}
