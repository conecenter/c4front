package ee.cone.c4ui

import ee.cone.c4ui.FrontTypes.Em
import ee.cone.c4vdom.Types._
import ee.cone.c4vdom._

trait FrontAppBase

trait GridRoot extends ToChildPair {
  def key: String = gridKey
  def gridKey: String
}

trait Cell {
  def colKey: String
  def rowKey: String
}

trait ViewCell extends ToChildPair with Cell{
  def colKey: String
  def rowKey: String
  def key: String = s"cell-$colKey-$rowKey"
}


trait GridCell extends ViewCell
@c4tagSwitch("FrontApp") trait DragHandle extends ToJson
@c4tagSwitch("FrontApp") trait GridRow extends ToJson {
  def rowKey: String
}
@c4tagSwitch("FrontApp") trait GridCol extends ToJson {
  def colKey: String
}
@c4tagSwitch("FrontApp") trait GridColWidth extends ToJson
@c4tagSwitch("FrontApp") trait Expanding extends ToJson

trait FilterItem extends ToChildPair
trait FilterButton extends ToChildPair
@c4tagSwitch("FrontApp") trait FilterButtonArea extends ToJson

@c4tagSwitch("FrontApp") trait HighlightByAttr extends ToJson

trait PivotCell extends ViewCell
@c4tagSwitch("FrontApp") trait PivotSlice extends ToJson {
  def sliceKey: String
  def slices: List[PivotSlice]
}
trait PivotTerminalSlice extends PivotSlice {
  def slices: List[PivotSlice] = Nil
}
trait PivotGroupSlice extends PivotSlice {
  def slices: List[PivotSlice]
}
@c4tagSwitch("FrontApp") trait PivotSliceWidth extends ToJson

object NoReceiver extends NoReceiver[Unit](){
  def apply[C]: Receiver[C] =
    this.asInstanceOf[Receiver[C]]
}

case class NoReceiver[C]() extends Receiver[C] {
  def receive: Handler = _ => identity
}

@c4tags("FrontApp") trait ListTags[C] {
  @c4el("GridRoot") def gridRoot(
    gridKey: String,
    dragCol: Receiver[C],
    dragRow: Receiver[C],
    rows: List[GridRow],
    cols: List[GridCol],
    children: ElList[GridCell],
    clickAction: Receiver[C] = NoReceiver[C],
    hasHiddenCols: Receiver[C] = NoReceiver[C],
    alwaysShowExpander: Boolean = false,
    rowHeightMultiplier: Int = 1,
  ): GridRoot
  @c4val def gridRow(
    rowKey: String,
    canDropBeside: Boolean = false,
    canDropInto: Boolean = false,
    isExpanded: Boolean = false,
    isHeader: Boolean = false,
  ): GridRow
  @c4val def gridCol(
    colKey: String,
    width: GridColWidth,
    hideWill: Int,
    isExpander: Boolean = false,
    canDropBeside: Boolean = false,
  ): GridCol
  @c4el("GridCell") def gridCell(
    rowKey: String,
    colKey: String,
    children: ViewRes = Nil,
    classNames: List[CSSClassName] = Nil,
    expanding: Expanding = expandableExpanding,
    dragHandle: DragHandle = noDragHandle,
    noDefCellClass: Boolean = false,
    needsHoverExpander: Boolean = true,
    spanRight: Boolean = false,
  ): GridCell
  @c4val("") def expandableExpanding: Expanding
  @c4val("none") def nonExpandableExpanding: Expanding
  @c4val("expander") def expanderExpanding: Expanding
  @c4val("") def noDragHandle: DragHandle
  @c4val("x") def colDragHandle: DragHandle
  @c4val("y") def rowDragHandle: DragHandle
  @c4val("bound") def boundGridColWidth(min: Em, max: Em): GridColWidth
  @c4val("unbound") def unboundGridColWidth(min: Em): GridColWidth

  @c4el("HoverExpander") def hoverExpander(
    key: String,
    children: ViewRes = Nil,
  ): ToChildPair

  @c4el("ExpandableTableHeader") def expTableHeader(
    key: String,
    title: String,
    shortTitle: String = "",
    hoverClassNames: List[CSSClassName] = Nil,
    children: ViewRes = Nil,
  ): ToChildPair

  //
  @c4el("FilterArea") def filterArea(
    key: String,
    className: CSSClassName = NoCSSClassName,
    filters: ElList[FilterItem] = Nil,
    buttons: ElList[FilterButton] = Nil,
  ): ToChildPair
  @c4el("MassOp") def massOp(
    key: String,
    area: FilterButtonArea,
    name: String = "",
    nameFolded: String = "",
    icon: String = "",
    receiver: Receiver[C] = NoReceiver[C],
    color: ColorDef,
    umid: String = "",
    children: ViewRes = Nil,
  ): FilterButton
  @c4el("FilterButtonPlace") def filterButtonPlace(
    key: String,
    area: FilterButtonArea,
    children: ViewRes = Nil,
  ): FilterButton
  @c4el("FilterButtonExpander") def filterButtonExpander(
    key: String,
    area: FilterButtonArea,
    color: ColorDef,
    name: String = "",
    icon: String = "",
    filterValue: String,
    filterInput: Receiver[C],
    optButtons: ElList[FilterButton] = Nil,
  ): FilterButton
  @c4val("lt") def leftFilterButtonArea: FilterButtonArea
  @c4val("rt") def rightFilterButtonArea: FilterButtonArea
  @c4el("FilterItem") def filterItem(
    key: String,
    minWidth: Em,
    maxWidth: Em,
    canHide: Boolean = false,
    className: CSSClassName = NoCSSClassName,
    children: ViewRes = Nil,
  ): FilterItem
  //
  @c4el("PopupManager") def popupManager(
    key: String,
    openedPopups: List[String],
    children: ViewRes = Nil,
    receiver: Receiver[C] = NoReceiver[C],
  ): ToChildPair
  //
  @c4el("PrintManager") def printManager(
    key: String,
    children: ViewRes,
    printChildren: ViewRes = Nil,
    printMode: Boolean = false,
    receiver: Receiver[C] = NoReceiver[C],
    printTitle: String = "",
  ): ToChildPair
  //
  @c4el("Highlighter") def highlighter(
    key: String,
    attrName: HighlightByAttr,
    highlightClass: CSSClassName = NoCSSClassName,
    notHighlightClass: CSSClassName = NoCSSClassName,
    gridKey: String = "",
  ): ToChildPair
  @c4val("data-row-key") def rowHighlightByAttr: HighlightByAttr
  @c4val("data-col-key") def colHighlightByAttr: HighlightByAttr
  //
  @c4el("PivotRoot") def pivotRoot(
    key: String,
    rows: List[PivotSlice],
    cols: List[PivotSlice],
    children: ElList[PivotCell],
    classNames: List[CSSClassName] = Nil,
  ): ToChildPair
  @c4el("PivotCell") def pivotCell(
    colKey: String,
    rowKey: String,
    classNames: List[CSSClassName] = Nil,
    children: ViewRes = Nil,
    clickAction: Receiver[C] = NoReceiver[C],
    doubleClickAction: Receiver[C] = NoReceiver[C]
  ): PivotCell
  @c4val("group") def pivotGroupSlice(
    sliceKey: String,
    slices: List[PivotSlice],
  ): PivotGroupSlice
  @c4val("terminal") def pivotTerminalSlice(
    sliceKey: String,
    width: PivotSliceWidth,
  ): PivotTerminalSlice
  @c4val("bound") def boundPivotSliceWidth(min: Em, max: Em): PivotSliceWidth
  @c4val("unbound") def unboundPivotSliceWidth(): PivotSliceWidth

  //
  @c4el("InputLabel") def inputWrapper(
    key: String,
    caption: String,
    wrapperNeeded: Boolean = true,
    children: ViewRes = Nil,
  ): ToChildPair
}
