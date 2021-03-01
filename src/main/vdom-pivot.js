import {createElement as $, useCallback} from "react"
import {identityAt, never} from "./vdom-util.js";
import {useSync} from "./vdom-hooks.js";

const fromKey = key => CSS.escape(`${key}-from`)
const toKey = key => CSS.escape(`${key}-to`)

const wrapRangeStr = (key,content) => (
    `${fromKey(key)}${content}${toKey(key)}`
)

const em = v => `${v}em`

const toRangeWidthStr = width => (
    width === "unbound" ? "auto" :
    width.tp === "bound" ? `minmax(${em(width.min)},${em(width.max)})` :
    never()
)

const getTemplateInner = slices => slices.map(({tp,sliceKey,...arg}) => (
    tp === "terminal" ? `${fromKey(sliceKey)}] ${toRangeWidthStr(arg.width)} [${toKey(sliceKey)}` :
    tp === "group" ? `${fromKey(sliceKey)} ${getTemplateInner(arg.slices)} ${toKey(sliceKey)}` :
    never()
)).join(" ")
const getTemplate = slices => `[${getTemplateInner(slices)}]`


export function PivotRoot({rows, cols, children, classNames: argClassNames}) {
    const gridTemplateColumns = getTemplate(cols)
    const gridTemplateRows = getTemplate(rows)
    const className = argClassNames ? argClassNames.join(" ") : ""
    const style = {display: "grid", gridTemplateRows, gridTemplateColumns}
    return $("div", {style, className, children})
}

const clickActionIdOf = identityAt('clickAction')

//On handling double click https://medium.com/trabe/prevent-click-events-on-double-click-with-react-with-and-without-hooks-6bf3697abc40
export function PivotCell({identity, colKey, rowKey, classNames, children}) {
    const className = classNames ? classNames.join(" ") : ""
    const gridArea = `${fromKey(rowKey)} / ${fromKey(colKey)} / ${toKey(rowKey)} / ${toKey(colKey)}`
    const [clickActionPatches, enqueueClickActionPatch] = useSync(clickActionIdOf(identity))
    const onClick = useCallback(ev => {
        enqueueClickActionPatch({headers: {"x-r-action": "click"}});
        ev.stopPropagation();
    }, [enqueueClickActionPatch])
    const onDoubleClick = useCallback(ev => {
        enqueueClickActionPatch({headers: {"x-r-action": "double-click"}});
        ev.stopPropagation();
    }, [enqueueClickActionPatch])
    return $("div", {style: {gridArea}, className, children, onClick, onDoubleClick})
}

export const components = {PivotRoot,PivotCell}
