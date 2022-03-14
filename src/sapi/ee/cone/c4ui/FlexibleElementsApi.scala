package ee.cone.c4ui

import ee.cone.c4di._
import ee.cone.c4ui.FrontTypes.Em
import ee.cone.c4vdom.Types._
import ee.cone.c4vdom._

@c4tagSwitch("FrontApp") trait FlexibleSize extends ToJson

trait FlexibleElement extends ToChildPair

@c4tags("FrontApp") trait FlexibleElementsTags {
  @c4val def flexibleSizes(
    min: Em,
    max: Em
  ): FlexibleSize

  @c4el("FlexibleColumnRoot") def flexibleColumnRoot(
    key: String,
    children: ElList[FlexibleElement]
  ): ToChildPair

  @c4el("FlexibleColumn") def flexibleColumn(
    key: String,
    sizes: FlexibleSize,
    children: ElList[FlexibleElement]
  ): FlexibleElement

  @c4el("FlexibleGroupbox") def flexibleGroupbox(
    key: String,
    sizes: FlexibleSize,
    children: ElList[FlexibleElement]
  ): FlexibleElement

  @c4el("FlexibleRow") def flexibleRow(
    key: String,
    sizes: FlexibleSize,
    leftChildren: ElList[FlexibleElement],
    centerChildren: ElList[FlexibleElement] = Nil,
    rightChildren: ElList[FlexibleElement] = Nil,
  ): FlexibleElement

  @c4el("FlexibleCell") def flexibleCell(
    key: String,
    sizes: FlexibleSize,
    children: ViewRes
  ): FlexibleElement
}
