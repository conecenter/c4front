import {createElement as el, useCallback, useRef, useState} from "react";
import clsx from "clsx";
import {DndProvider, useDrag, useDrop} from "react-dnd";
import {PivotFields} from "./pivot-fields";
import {
    PivotDragItem,
    PivotDropAction,
    getPivotChange,
    patchSyncTransformers,
    PivotClickAction,
    getClickChange
} from "./pivot-exchange";
import {ItemTypes, PartNames} from "./pivot-const";
import {HTML5Backend} from "react-dnd-html5-backend";
import type {XYCoord} from "react-dnd/dist";
import {usePatchSync} from "../exchange/patch-sync";
import { identityAt } from "../../main/vdom-util";
import { DragScroller } from "./drag-scroller";

const receiverIdOf = identityAt('receiver');

export interface PivotField {
    id: string,
    name: string,
    selected: boolean,
    fieldType?: string,
    invalid?: boolean
}

export interface PivotFieldsGroup {
    groupName: string,
    fields: PivotField[]
}

export interface PivotSettingsState {
    fields: (PivotField | PivotFieldsGroup)[],
    pivotFilters: PivotField[]
    pivotBreaks: PivotField[]
    pivotRows: PivotField[]
    pivotColumns: PivotField[]
    pivotData: PivotField[]
    pivotCells: PivotField[]
}

export type PivotSettingsPartClass = 'pivotFilters' | 'pivotBreaks' | 'pivotRows' | 'pivotColumns' | 'pivotData' | 'pivotCells';

export interface PivotSettingsProps extends PivotSettingsState {
    // @ts-ignore
    identity: object
}

export function PivotSettings(props: PivotSettingsProps) {
    return el(DndProvider, {backend: HTML5Backend},
        el(DragScroller),
        el(PivotSettingsInner, {...props})
    )
}

function PivotSettingsInner(props: PivotSettingsProps) {
    const {currentState: state, sendTempChange, sendFinalChange} = usePatchSync(
        receiverIdOf(props.identity),
        props,
        false,
        patchSyncTransformers
    )
    const ref = useRef<HTMLDivElement | null>(null)
    const dropAction: PivotDropAction = useCallback((event: PivotDragItem, dropLocation: string, dropCoordinates?: XYCoord | null, temporary?: boolean) => {
        const change = getPivotChange(state, ref.current, {...event, dropLocation, dropCoordinates}, temporary)
        if (change.tp === "noop") return
        else if (temporary) sendTempChange(change)
        else sendFinalChange(change)
    }, [state])
    const clickAction: PivotClickAction = useCallback(((origin, itemId) => sendFinalChange(getClickChange(origin, itemId))), [state])
    return el("div", {ref, className: "pivotSettings"},
        el(PivotFields, {fields: state.fields, dropAction}),
        el(PivotSettingsPart, {
            key: "filterFields",
            className: "pivotFilters",
            label: "Filters",
            state,
            dropAction,
            clickAction,
            accepts: ItemTypes.FILTER
        }),
        el(PivotSettingsPart, {
            key: "breakFields",
            className: "pivotBreaks",
            label: "Breaks",
            state,
            dropAction,
            clickAction,
            accepts: ItemTypes.DIMENSION
        }),
        el(PivotSettingsPart, {
            key: "colFields",
            className: "pivotColumns",
            label: "Columns",
            state,
            dropAction,
            clickAction,
            accepts: ItemTypes.DIMENSION
        }),
        el(PivotSettingsPart, {
            key: "rowFields",
            className: "pivotRows",
            label: "Rows",
            state,
            dropAction,
            clickAction,
            accepts: ItemTypes.DIMENSION
        }),
        el(PivotSettingsPart, {
            key: "dataFields",
            className: "pivotData",
            label: "Data",
            state,
            dropAction,
            clickAction,
            accepts: ItemTypes.DATA
        }),
        el(PivotSettingsPart, {
            key: "cellFields",
            className: "pivotCells",
            label: "Cell",
            state,
            dropAction,
            clickAction,
            accepts: ItemTypes.DIMENSION
        })
    )
}

interface PivotSettingsPartProps {
    className: PivotSettingsPartClass
    state: PivotSettingsState
    label: string
    dropAction: PivotDropAction
    clickAction: PivotClickAction
    accepts: string
}

function PivotSettingsPart({className, state, label, dropAction, clickAction, accepts}: PivotSettingsPartProps) {
    const [{canDrop}, drop] = useDrop(() => ({
        accept: [ItemTypes.FIELD, ...Object.values(ItemTypes).filter(val => val.includes(accepts))],
        canDrop: (pivotItem: PivotDragItem) => 
            pivotItem.dragOrigin !== 'pivotFields' && pivotItem.item.invalid ? false : true,
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
        el('span', null, label),
        state[className].map((value) => el(PivotField, {
            key: value.id,
            type: accepts,
            origin: className,
            field: value,
            dropAction,
            clickAction
        }))
    )
}

interface PivotFieldProps {
    origin: string
    type: string
    field: PivotField
    dropAction: PivotDropAction
    clickAction?: PivotClickAction
}

export function PivotField({origin, type, field, dropAction, clickAction}: PivotFieldProps) {
    const accepts = origin !== PartNames.FIELDS ? [type] : []
    const [_, drop] = useDrop({
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
    const className = clsx(
        'pivotButton', 
        isDragging && "pivotDraggedElement", 
        field.selected && "pivotSelectedElement",
        field.invalid && "pivotInvalidElement"
    )
    const onClick = clickAction ? () => clickAction(origin, field.id) : undefined
    return el("button", {
        key: field.id,
        "data-id": field.id,
        ref: (ref) => drag(drop(ref)),
        onClick: onClick,
        className
    }, field.name)
}


export interface PivotFieldsGroupProps {
    key: string,
    groupName: string,
    dropAction: PivotDropAction,
    fields: PivotField[]
}

export function PivotFieldsGroup({ groupName, dropAction, fields }: PivotFieldsGroupProps) {
    const [opened, setOpened] = useState(false);
    return (
        el('div', {className: clsx('pivotFieldsGroup', opened && 'openedPivotGroup')}, 
            el('button', {className: 'btnOpenGroup', onClick: () => setOpened(!opened)},
                el('img', {src: '/mod/main/ee/cone/core/ui/c4view/arrow-down.svg', className: 'textLineSize', alt: 'arrow-down'}),
                el('span', null, groupName),
            ),
            el('div', null, fields.map(item => el(
                PivotField, {key: item.id, type: item.fieldType || ItemTypes.FIELD, origin: PartNames.FIELDS, field: item, dropAction})
            ))
        )
    )
}

export function isPivotFieldsGroup(item: PivotField | PivotFieldsGroup): item is PivotFieldsGroup { 
    return (item as PivotFieldsGroup).groupName !== undefined; 
}
