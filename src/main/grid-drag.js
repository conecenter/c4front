
import {useState,useMemo,useCallback} from "react"
import {useEventListener,useAnimationFrame} from "./vdom-hooks.js"
import {findFirstParent,sortedWith,range} from "./vdom-util.js"

const distinctBy = f => l => { //gives last?
    const entries = l.map(el => [f(el), el])
    const map = Object.fromEntries(entries)
    return entries.filter(([k, v]) => map[k] === v).map(([k, v]) => v)
}

const getLast = l => l[l.length - 1]

const getElementClientFrom = (axis,element) => element.getBoundingClientRect()[fromProp[axis]]

const fromProp = { x: "left", y: "top" }
const toProp = { x: "right", y: "bottom" }
const getClientSize = { x: el => el.clientWidth, y: el => el.clientHeight }
const keyAttrName = { x: "data-col-key", y: "data-row-key" }

export const useGridDrag = (state,setState,styles,checkDrop) => {
    const onMouseDown = useCallback(ev=>{
        const evData = getEventData(ev)
        setState(was => doMove(start(was,evData),evData,checkDrop))
    }, [setState,checkDrop])
    const move = useCallback(ev=>{
        const evData = getEventData(ev)
        setState(was=>doMove(was,evData,checkDrop))
    }, [setState,checkDrop])
    const enabledMove = state.isDown && move
    useEventListener(state.document, "mousemove", enabledMove)
    useEventListener(state.document, "mouseup", enabledMove)
    const frame = useCallback(()=>setState(was=>{
        if(!was.axis) return was
        const {axis,gridElement} = was
        const gridClientFrom = getElementClientFrom(axis,gridElement)
        return was.gridClientFrom === gridClientFrom ? was : {...was,gridClientFrom}
    }),[setState])
    useAnimationFrame(state.gridElement, frame)
    const cssContent = useMemo(()=>getCSSContent(styles,state),[styles,state])
    //console.log(cssContent)
    return [cssContent, onMouseDown]
}

const getEventData = ev => {
    const {target} = ev
    const eventClientPos = { y: ev.clientY, x: ev.clientX }
    const isDown = ev.buttons > 0
    return {target,eventClientPos,isDown}
}

const start = (state,evData) => {
    if(state.axis) return state
    const {target,eventClientPos,isDown} = evData
    const axis = findFirstParent(el=>el.getAttribute("data-drag-handle"))(target)
    if (!axis) return state
    const withKey = element => {
        const key = element.getAttribute(keyAttrName[axis])
        return key ? {element,key} : null
    }
    const item = findFirstParent(withKey)(target)
    const gridElement = item.element.parentElement
    const gridClientFrom = getElementClientFrom(axis,gridElement)
    const addRectData = ({key,element}) => {
        const rect = element.getBoundingClientRect()
        return { key, from: rect[fromProp[axis]]-gridClientFrom, to: rect[toProp[axis]]-gridClientFrom }
    }
    const drag = addRectData(item)
    const children = sortedWith((a, b) => a.to - b.to)(
        distinctBy(d=>d.key)([...gridElement.children].map(withKey).filter(Boolean))
        .map(addRectData)
    )
    const startEventPos = eventClientPos[axis] - gridClientFrom
    const document = gridElement.ownerDocument
    const clientSize = getClientSize[axis](document.documentElement)
    return {...state,axis,gridElement,drag,children,startEventPos,clientSize,document,isDown} //all rel to grid
}

const getOffsetDir = (item,target) => Math.sign(target.to-item.to)
const halfSizeOf = d => (d.to - d.from)/2
const centerOf = d => (d.to+d.from)/2

const doMove = (state,evData,checkDrop) => {
    if(!state.axis || !state.isDown) return state
    const {eventClientPos,isDown} = evData
    const {axis,gridElement,children,drag,startEventPos} = state
    const gridClientFrom = getElementClientFrom(axis,gridElement)
    const currentEventPos = eventClientPos[axis] - gridClientFrom
    const getDropPos = item => (currentEventPos - (centerOf(item) + getOffsetDir(item,drag)*halfSizeOf(drag))) / halfSizeOf(item)
    const toDropZone = v => v < -0.5 ? -1 : v > 0.5 ? 1 : 0
    const drop =
        children.find(item => item.key === drag.key ? false : getDropPos(item) < 1) ||
        getLast(children)
    const dropZone = toDropZone(getDropPos(drop))
    const dPos = currentEventPos - startEventPos
    const canDrop = checkDrop({isDown,axis,drag,drop,dropZone})
    return {...state,gridClientFrom,dPos,drop,dropZone,isDown,canDrop}
}

const getCSSContent = (styles,state) => { //all rel to grid
    if(!state.axis) return '';
    const {axis,children,drag,drop,dropZone,canDrop,dPos,gridClientFrom,clientSize} = state
    const rootStyle = !canDrop || dropZone === 0 ? "" : `${styles.rootSelector} > ${styles.bgSelector} { ${styles.dropRoot} }\n`
    return rootStyle + children.map(item=>{
        const offset =
            item.key === drag.key ? dPos : (
                getOffsetDir(item,drag) - (getOffsetDir(item,drop) || dropZone)
            ) * halfSizeOf(drag)
        if(!offset) return ""
        const prop = offset > 0 ? fromProp[axis] : toProp[axis]
        const value = offset > 0 ?
            gridClientFrom + item.from + offset :
            clientSize - (gridClientFrom + item.to + offset)
        const addStyle =
            item.key === drag.key ? styles.dragItem :
            canDrop && item.key === drop.key && dropZone===0 ? styles.dropItem : ""
        return `${styles.rootSelector} > div[${keyAttrName[axis]}="${item.key}"] { position: sticky; ${prop}: ${value}px; ${addStyle} }\n`
    }).join("")
}
