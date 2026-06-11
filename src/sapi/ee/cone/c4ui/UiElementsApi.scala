package ee.cone.c4ui

import ee.cone.c4ui.FrontTypes.Em
import ee.cone.c4vdom.Types._
import ee.cone.c4vdom._

@c4tagSwitch("FrontApp") trait FlexSize extends ToJson {
  def min: Option[Em]
  def max: Option[Em]
  def basis: Option[Em]
}

trait UIElement extends ToChildPair

@c4tags("FrontApp") trait UIElements {
  @c4val def flexSize(
    min: Option[Em] = None,
    max: Option[Em] = None,
    basis: Option[Em] = None,
  ): FlexSize

  @c4el("FlexibleColumn") def column(
    key: String,
    sizes: Option[FlexSize] = None,
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

  @c4el("FlexibleRow") def row(
    key: String,
    sizes: Option[FlexSize] = None,
    align: Option[Align] = None,
    children: ViewRes,
    className: Option[String] = None,
  ): UIElement

  @c4el("ThinFlexibleRow") def thinRow(
    key: String,
    sizes: Option[FlexSize] = None,
    align: Option[Align] = None,
    children: ViewRes,
    className: Option[String] = None,
  ): UIElement

  @c4el("FlexibleCell") def cell(
    key: String,
    sizes: Option[FlexSize] = None,
    align: Option[Align] = None,
    children: ViewRes,
    className: Option[String] = None,
  ): UIElement
}
