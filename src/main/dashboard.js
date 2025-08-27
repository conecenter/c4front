import {createElement as $,useCallback,useEffect,useState} from "react"
import clsx from "clsx";
import {useObservedChildSizes,getFontSize,useWidth} from "./sizes.js"
import {sum,em} from "./vdom-util.js"
import {useEventListener} from './vdom-hooks.js'
import {colorToProps} from "../extra/view-builder/common-api";

const limited = (minV,v,maxV)=>Math.min(Math.max(minV,v),maxV)

const groupByIndex = (items,by) => {
    const res = []
    items.forEach((item,j)=>(res[by(j)]??=[]).push(item))
    return res
}

const elementToUnscaledHeightUpdater = element => {
    const height = parseFloat(getComputedStyle(element).height) / getFontSize(element) // left side can be rounded to pixels while right is not, so result is not perfectly unscaled
    return was => !was || was < height ? height : was                                  // so we only increase memorized height to avoid chatter
}

const div = attr => $("div",attr)

export const DashboardRoot = ({
    containerHeight, containerPaddingTop, containerPaddingLeft, containerStyle,
    children=[], cardsColor, boardStyle, // board is inside container
    minColWidth, maxColWidth, minScale, maxScale, cardStyles, rowGap, colGap // col widths are in em-s before scaling
}) => {
    const [containerWidth,ref] = useWidth()
    const [theHeights,addObserved] =
        useObservedChildSizes("data-unscaled-height-key",elementToUnscaledHeightUpdater)
    if(children.length <= 0) return null
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
            wasBest && boardWidth * scaleToApply > containerInnerWidth ? // while scaleToFitContainer seems optimal, minScale can prevent fitting width at all
            wasBest : {scaleToFitContainer,scaleToApply,colCount,boardWidth,rowHeights}
        return colCount <= children.length ? calcBoardSizes(colCount+1, willBest) : wasBest;
    }
    const boardSizes = calcBoardSizes(1,undefined)
    const freeWidth =
        Math.max(0, containerInnerWidth / boardSizes.scaleToApply - boardSizes.boardWidth)
    const cardWidth = Math.min(maxColWidth, minColWidth + freeWidth / boardSizes.colCount)
    const {style: cardsColorStyle, className: cardsColorClass} = colorToProps(cardsColor)
    return div({
        ref,
        style: {
            ...containerStyle, minHeight: em(containerHeight), display: "grid",
            padding: `${em(containerPaddingTop)} ${em(containerPaddingLeft)}`
        },
        children: [div({
            key: "board",
            style: {
                ...boardStyle,
                display: "grid", justifySelf: "center"/*v*/, alignSelf: "start"/*h*/,
                alignItems: "start",
                rowGap: em(rowGap), columnGap: em(colGap),
                gridTemplateColumns: `repeat(${boardSizes.colCount}, ${em(cardWidth)})`,
                gridTemplateRows: boardSizes.rowHeights.map(h => h === 0 ? 'auto' : em(h)).join(" "),
                fontSize: `${boardSizes.scaleToApply*100}%`,
            },
            children: children.map(c=>addObserved(c.key, {
                    key: c.key, className: clsx('dashboardCardBox', cardsColorClass),
                    style: { maxWidth: em(cardWidth), ...cardStyles, ...cardsColorStyle }, children:c
                }),
            )
        })]
    })
}


export const Dashboard = ({
    minColWidth, maxColWidth, 
    minScale, maxScale, 
    rowGap, colGap, 
    containerPaddingTop = 1,
    containerPaddingLeft = 1,
    cardsColor, children
}) => {
    const [{elem, containerHeight}, setState] = useState({});

    const setParams = useCallback(element => {
        if (element) setState({elem: element, containerHeight: countFreeVpSpace(element)});
    }, []);
    const recalcParams = useCallback(() => setParams(elem), [elem]);

    const win = elem?.ownerDocument.defaultView;
    useEventListener(win, 'resize', recalcParams);

    useEffect(() => {
        if (!elem) return;
        const observer = new ResizeObserver(entries => {entries.forEach(recalcParams)});
        observer.observe(elem.ownerDocument.body, {box: "border-box"});
        return () => observer.disconnect();
    }, [elem]);

    return $("div", {ref: setParams, className: 'dashboard'}, containerHeight !== undefined && $(DashboardRoot, {
            containerHeight, containerPaddingTop, containerPaddingLeft,
            minColWidth, maxColWidth,
            rowGap, colGap,
            minScale, maxScale,
            cardsColor, children
        })
    );
}

function countFreeVpSpace(element) {
    const vpHeight = element.ownerDocument.documentElement.clientHeight;
    const offsetTop = Math.ceil(element.getBoundingClientRect().top + element.ownerDocument.defaultView.scrollY);
    const freeSpaceHeight = vpHeight  - offsetTop;
    const heightEm = freeSpaceHeight < 0 ? 0 : Math.floor(freeSpaceHeight / getFontSize(element));
    return heightEm;
}

/*
We try to maximize usage of viewport area.
Find such number of columns, for which we can fit board to viewport with max scale.

Having different card heights, ex 3-col layout can happen to be higher than 2-col one,
so we need to try every col count.

when col-count and scale is chosen, we can make cards a bit wider

in grid: justifySelf ~ align, alignSelf ~ vertical align

*/