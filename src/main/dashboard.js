
import {createElement as $,useCallback,useContext,useEffect,useState} from "react"
import {useObservedChildSizes,getFontSize,useWidth} from "./sizes.js"
import {sum,em} from "./vdom-util.js"
import {ScrollInfoContext} from '../extra/scroll-info-context';

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
    children, boardStyle, // board is inside container
    minColWidth, maxColWidth, minScale, maxScale, cardStyles, rowGap, colGap // col widths are in em-s before scaling
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
            wasBest && boardWidth * scaleToApply > containerInnerWidth ? // while scaleToFitContainer seems optimal, minScale can prevent fitting width at all
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
                display: "grid", // justifySelf: "center"/*h*/, alignSelf: "center"/*v*/,
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


export const Dashboard = ({
    minColWidth, maxColWidth, 
    minScale, maxScale, 
    rowGap, colGap, 
    containerPaddingTop = 0, containerPaddingLeft = 0, 
    children
}) => {
    const [{elem, containerHeight}, setState] = useState({});
    const {totalSpaceUsed} = useContext(ScrollInfoContext);

    const setParams = useCallback((element) => {
        if (element) {
            const vpHeight = element.ownerDocument.documentElement.clientHeight;
            const heightEm = (vpHeight - totalSpaceUsed) / getFontSize(element);
            setState({elem: element, containerHeight: heightEm});
        } else setState({});
    }, [totalSpaceUsed]);

    useEffect(() => {
        const win = elem?.ownerDocument.defaultView;
        win?.addEventListener('resize', () => setParams(elem));
        return win?.removeEventListener('resize', () => setParams(elem));
    }, [elem, setParams]);

    return $("div", {ref: setParams}, containerHeight && $(DashboardRoot, {
            containerHeight, containerPaddingTop, containerPaddingLeft,
            minColWidth, maxColWidth,
            rowGap, colGap,
            minScale, maxScale,
            children
        })
    );
}


/*
We try to maximize usage of viewport area.
Find such number of columns, for which we can fit board to viewport with max scale.

Having different card heights, ex 3-col layout can happen to be higher than 2-col one,
so we need to try every col count.

when col-count and scale is chosen, we can make cards a bit wider

in grid: justifySelf ~ align, alignSelf ~ vertical align

*/