
import {createElement} from "react"
import {useObservedChildSizes,getFontSize,useWidth} from "./sizes.js"
import {sum,em} from "./vdom-util.js"

const limited = (minV,v,maxV)=>Math.min(Math.max(minV,v),maxV)

const groupByIndex = (items,by) => {
    const res = []
    items.forEach((item,j)=>(res[by(j)]??=[]).push(item))
    return res
}

const elementToUnscaledHeightUpdater = element => {
    const height = parseFloat(getComputedStyle(element).height) / getFontSize(element)
    return was => !was || was < height ? height : was
}

const div = attr => createElement("div",attr)

export const DashboardRoot = ({
    containerHeight, containerPaddingTop, containerPaddingLeft, containerStyle,
    children, boardStyle,
    minColWidth, maxColWidth, minScale, maxScale, cardStyles, rowGap, colGap
}) => {
    if(children.length <= 0) return null
    const [containerWidth,ref] = useWidth()
    const [theHeights,addObserved] =
        useObservedChildSizes("data-unscaled-height-key",elementToUnscaledHeightUpdater)
    const containerInnerWidth = Math.max(0, containerWidth - containerPaddingLeft * 2)
    const containerInnerHeight = Math.max(0, containerHeight - containerPaddingTop * 2)
    const cardHeights = children.map(c=>theHeights[c.key]||0)
    const calcBoardSizes = (colCount,wasBest) => {
        const boardWidth = minColWidth * colCount + colGap * (colCount-1)
        const scaleToFitContainerWidth =
            isFinite(containerInnerWidth) ? containerInnerWidth / boardWidth : 1
        if(wasBest && scaleToFitContainerWidth <= wasBest.scaleToFitContainer) return wasBest
        const cardHeightsByRow = groupByIndex(cardHeights, j => Math.floor(j / colCount))
        const rowHeights = cardHeightsByRow.map(hs=>Math.max(...hs))
        const boardHeight = sum(rowHeights) + rowGap * (rowHeights.length-1)
        const scaleToFitContainerHeight = containerInnerHeight / boardHeight
        const scaleToFitContainer = Math.min(scaleToFitContainerWidth, scaleToFitContainerHeight)
        const scaleToApply = limited(minScale, scaleToFitContainer, maxScale)
        const willBest =
            wasBest && scaleToFitContainer < wasBest.scaleToFitContainer ||
            wasBest && boardWidth * scaleToApply > containerInnerWidth ?
            wasBest : {scaleToFitContainer,scaleToApply,colCount,boardWidth,rowHeights}
        return calcBoardSizes(colCount+1, willBest)
    }
    const boardSizes = calcBoardSizes(1,undefined)
    const freeWidth =
        Math.max(0, containerInnerWidth / boardSizes.scaleToApply - boardSizes.boardWidth)
    const cardWidth = Math.min(maxColWidth, minColWidth + freeWidth / boardSizes.colCount)
    return div({
        ref,
        style: {
            ...containerStyle, minHeight: em(containerHeight), display: "grid",
            padding: `${em(containerPaddingTop)} ${em(containerPaddingLeft)}`,
        },
        children: [div({
            key: "board",
            style: {
                ...boardStyle,
                display: "grid", justifySelf: "center"/*h*/, alignSelf: "center"/*v*/,
                alignItems: "start",
                rowGap: em(rowGap), columnGap: em(colGap),
                gridTemplateColumns: `repeat(${boardSizes.colCount}, ${em(cardWidth)})`,
                gridTemplateRows: boardSizes.rowHeights.map(em).join(" "),
                fontSize: `${boardSizes.scaleToApply*100}%`,
            },
            children: children.map(c=>div({
                key: c.key,
                style: { ...cardStyles, width: em(cardWidth) },
                children: [addObserved(c.key, {
                    key: "observed",
                    style: { maxWidth: em(minColWidth) }, children:[c]
                })],
            }))
        })]
    })
}
