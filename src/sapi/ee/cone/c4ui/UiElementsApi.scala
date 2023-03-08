package ee.cone.c4ui

import ee.cone.c4di._
import ee.cone.c4ui.FrontTypes.Em
import ee.cone.c4vdom.Types._
import ee.cone.c4vdom._

@c4tagSwitch("FrontApp") trait Size extends ToJson {
  def min: Em
  def max: Option[Em]
}

@c4tagSwitch("FrontApp") trait Align extends ToJson

@c4tagSwitch("FrontApp") trait GroupboxDisplay extends ToJson

@c4tagSwitch("FrontApp") trait ChildAlign extends ToJson

trait UIElement extends ToChildPair

@c4tags("FrontApp") trait UIElements {
  @c4val def size(
    min: Em,
    max: Option[Em],
  ): Size

  @c4val("l") def left: Align
  @c4val("c") def center: Align
  @c4val("r") def right: Align
  @c4val("f") def fill: Align

  @c4el("FlexibleColumnRoot") def columnRoot(
    key: String,
    children: ElList[UIElement]
  ): ToChildPair

  @c4el("FlexibleColumn") def column(
    key: String,
    sizes: Option[Size] = None,
    align: Option[Align] = None,
    children: ViewRes,
    className: Option[String] = None,
  ): UIElement

  @c4el("ScrollableColumn") def scrollableColumn(
    key: String,
    children: ViewRes,
    height: Em,
    sizes: Option[Size] = None,
    align: Option[Align] = None,
    className: Option[String] = None,
  ): UIElement

  @c4val("accent") def groupboxAccented: GroupboxDisplay

  @c4el("FlexibleGroupbox") def groupbox(
    key: String,
    sizes: Option[Size] = None,
    align: Option[Align] = None,
    children: ElList[UIElement],
    label: Option[String] = None,
    displayStyle: Option[GroupboxDisplay] = None
  ): UIElement

  @c4el("FlexibleRow") def row(
    key: String,
    sizes: Option[Size] = None,
    align: Option[Align] = None,
    children: ViewRes,
    className: Option[String] = None,
  ): UIElement

  @c4el("ThinFlexibleRow") def thinRow(
    key: String,
    sizes: Option[Size] = None,
    align: Option[Align] = None,
    children: ViewRes,
    className: Option[String] = None,
  ): UIElement

  @c4val("FlexibleChildAlign") def childAlign(
    align: Option[Align],
  ): ChildAlign

  @c4el("FlexibleCell") def cell(
    key: String,
    sizes: Option[Size] = None,
    align: Option[Align] = None,
    children: ViewRes,
    className: Option[String] = None,
  ): UIElement

  @c4el("FlexibleLabeled") def labeled(
    key: String,
    sizes: Option[Size] = None,
    align: Option[Align] = None,
    label: String,
    children: ViewRes,
    labelChildren: ViewRes = Nil,
    horizontal: Boolean = false,
  ): UIElement
}
