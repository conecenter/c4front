import {createElement as el, useCallback, useRef} from "react";
import {DndProvider, useDrag, useDrop} from "react-dnd";
import {PivotFields} from "./pivot-fields";
import {
    PivotDragItem,
    PivotDropAction,
    getPivotChange,
    pivotServerStateToState,
    pivotChangeToState, patchToPivotChange, applyPivotChange, PivotClickAction, getClickChange
} from "./pivot-exchange";
import {ItemTypes, PartNames} from "./pivot-const";
import {HTML5Backend} from "react-dnd-html5-backend";
import {XYCoord} from "react-dnd/lib";
import {usePatchSync} from "../exchange/patch-sync";
import clsx from "clsx";
import { useClickSync } from "../exchange/click-sync";


export interface PivotField {
    id: string,
    name: string,
    selected: boolean,
    invalid?: boolean
}

export interface PivotFieldsGroup {
    identity: string,
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
    pivotCells: PivotField[],

    //[key: string]: PivotField[],
}

export type PivotSettingsPartClass = 'pivotFilters' | 'pivotBreaks' | 'pivotRows' | 'pivotColumns' | 'pivotData' | 'pivotCells';

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
    const {currentState: state, sendTempChange, sendFinalChange} = usePatchSync(
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
            key: "rowFields",
            className: "pivotColumns",
            label: "Columns",
            state,
            dropAction,
            clickAction,
            accepts: ItemTypes.DIMENSION
        }),
        el(PivotSettingsPart, {
            key: "colFields",
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
    identity: string,
    groupName: string,
    dropAction: PivotDropAction,
    fields: PivotField[]
}

export function PivotFieldsGroup({ identity, groupName, dropAction, fields }: PivotFieldsGroupProps) {
    console.log(identity)
    const {clicked, onClick} = useClickSync(identity, 'clickAction');
    console.log(clicked)
    return (
        el('div', {className: 'pivotFieldsGroup'}, 
            el('button', {className: 'btnOpenGroup', /*onClick: {}*/},
                el('img', {src: '../../test/datepicker/arrow-down.svg', className: 'textLineSize', alt: 'arrow-down'}),
                el('span', null, groupName),
            ),
            fields.map(item => el
                (PivotField, {key: item.id, type: ItemTypes.FIELD, origin: PartNames.FIELDS, field: item, dropAction})
            )
        )
    )
}

export function isPivotFieldsGroup(item: PivotField | PivotFieldsGroup): item is PivotFieldsGroup { 
    return (item as PivotFieldsGroup).groupName !== undefined; 
}
