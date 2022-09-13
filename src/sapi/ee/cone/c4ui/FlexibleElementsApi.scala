package ee.cone.c4ui

import ee.cone.c4di._
import ee.cone.c4ui.FrontTypes.Em
import ee.cone.c4vdom.Types._
import ee.cone.c4vdom._

@c4tagSwitch("FrontApp") trait FlexibleSize extends ToJson {
  def min: Em
  def max: Option[Em]
}

@c4tagSwitch("FrontApp") trait FlexibleAlignment extends ToJson

@c4tagSwitch("FrontApp") trait FlexibleGroupboxDisplay extends ToJson

@c4tagSwitch("FrontApp") trait FlexibleChildAlign extends ToJson

trait FlexibleElement extends ToChildPair

@c4tags("FrontApp") trait FlexibleElementsTags {
  @c4val def flexibleSizes(
    min: Em,
    max: Option[Em],
  ): FlexibleSize

  @c4val("l") def left: FlexibleAlignment
  @c4val("c") def center: FlexibleAlignment
  @c4val("r") def right: FlexibleAlignment
  @c4val("f") def fill: FlexibleAlignment

  @c4el("FlexibleColumnRoot") def flexibleColumnRoot(
    key: String,
    children: ElList[FlexibleElement]
  ): ToChildPair

  @c4el("FlexibleColumn") def flexibleColumn(
    key: String,
    sizes: Option[FlexibleSize],
    alignment: FlexibleAlignment,
    children: ViewRes,
    className: Option[String] = None,
  ): FlexibleElement

  @c4val("accent") def groupboxAccented: FlexibleGroupboxDisplay

  @c4el("FlexibleGroupbox") def flexibleGroupbox(
    key: String,
    sizes: Option[FlexibleSize],
    alignment: FlexibleAlignment,
    children: ElList[FlexibleElement],
    label: Option[String] = None,
    displayStyle: Option[FlexibleGroupboxDisplay] = None
  ): FlexibleElement

  @c4el("FlexibleRow") def flexibleRow(
    key: String,
    sizes: Option[FlexibleSize],
    alignment: FlexibleAlignment,
    children: ViewRes,
    className: Option[String] = None,
  ): FlexibleElement

  @c4val("FlexibleChildAlign") def flexibleChildAlign(
    alignment: Option[FlexibleAlignment],
  ): FlexibleChildAlign

  @c4el("FlexibleCell") def flexibleCell(
    key: String,
    sizes: Option[FlexibleSize],
    grow: Option[Boolean],
    alignment: FlexibleAlignment,
    children: ViewRes,
    className: Option[String] = None,
  ): FlexibleElement

  @c4el("FlexibleLabeled") def flexibleLabeled(
    key: String,
    sizes: Option[FlexibleSize],
    align: FlexibleAlignment,
    label: String,
    children: ViewRes,
    labelChildren: ViewRes = Nil,
    horizontal: Boolean = false,
  ): FlexibleElement
}
