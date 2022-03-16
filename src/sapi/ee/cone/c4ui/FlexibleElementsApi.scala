package ee.cone.c4ui

import ee.cone.c4di._
import ee.cone.c4ui.FrontTypes.Em
import ee.cone.c4vdom.Types._
import ee.cone.c4vdom._

@c4tagSwitch("FrontApp") trait FlexibleSize extends ToJson {
  def min: Em
  def max: Option[Em]
}

@c4tagSwitch("FrontApp") trait FlexibleAlign extends ToJson

trait FlexibleElement extends ToChildPair

@c4tags("FrontApp") trait FlexibleElementsTags {
  @c4val def flexibleSizes(
    min: Em,
    max: Option[Em] = None,
  ): FlexibleSize

  @c4val("l") def left: FlexibleAlign
  @c4val("c") def center: FlexibleAlign
  @c4val("r") def right: FlexibleAlign
  @c4val("f") def fill: FlexibleAlign

  @c4el("FlexibleColumnRoot") def flexibleColumnRoot(
    key: String,
    children: ElList[FlexibleElement]
  ): ToChildPair

  @c4el("FlexibleColumn") def flexibleColumn(
    key: String,
    sizes: FlexibleSize,
    align: FlexibleAlign,
    children: ElList[FlexibleElement]
  ): FlexibleElement

  @c4el("FlexibleGroupbox") def flexibleGroupbox(
    key: String,
    sizes: FlexibleSize,
    align: FlexibleAlign,
    children: ElList[FlexibleElement]
  ): FlexibleElement

  @c4el("FlexibleRow") def flexibleRow(
    key: String,
    sizes: FlexibleSize,
    align: FlexibleAlign,
    children: ElList[FlexibleElement],
  ): FlexibleElement

  @c4el("FlexibleCell") def flexibleCell(
    key: String,
    sizes: FlexibleSize,
    align: FlexibleAlign,
    children: ViewRes
  ): FlexibleElement
}
