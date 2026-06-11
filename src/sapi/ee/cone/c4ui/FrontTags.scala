package ee.cone.c4ui

import ee.cone.c4ui.FrontTypes.Em
import ee.cone.c4vdom.Types.{ElList, ViewRes}
import ee.cone.c4vdom._

trait PageTitle extends ToChildPair with ToJson {
  def key: String
}

trait PageFooter extends ToChildPair with ToJson {
  def footerKey: String

  def key: String = footerKey
}

trait PageTitleBlock extends ToChildPair with ToJson

@c4tagSwitch("FrontApp") trait ArrowRelation extends ToJson {
  def targetId: String

  def targetAnchor: String

  def sourceAnchor: String

  def style: ArrowStyle
}

@c4tagSwitch("FrontApp") trait ArrowStyle extends ToJson

@c4tagSwitch("FrontApp") trait PageTitleArea extends ToJson

@c4tagSwitch("FrontApp") trait ExternalLoginOption extends ToJson

@c4tags("FrontApp") trait FrontTags {
  @c4el("ColoredDiv") def coloredDiv(
    key: String,
    color: Option[ColorDef],
    children: ViewRes
  ): ToChildPair

  @c4el("ScalingElement") def scalingElement(
    key: String,
    scale: Em,
    children: ViewRes
  ): ToChildPair

  @c4el("TextWidth") def textWidth(
    key: String,
    text: String
  ): ToChildPair

  @c4el("PageTitle") def pageTitle(
    key: String,
    children: ElList[PageTitleBlock],
  ): PageTitle

  @c4el("PageTitleBlock") def pageTitleBlock(
    key: String,
    area: PageTitleArea,
    children: ViewRes,
    priority: Option[Int] = None,
  ): PageTitleBlock

  @c4val("l") def leftPageTitleArea(): PageTitleArea

  @c4val("c") def middlePageTitleArea(): PageTitleArea

  @c4val("r") def rightPageTitleArea(): PageTitleArea


  @c4el("PageFooter") def pageFooter(
    footerKey: String,
    children: ViewRes,
  ): PageFooter

  @c4el("ArrowContainer") def arrowContainer(
    key: String,
    children: ViewRes,
  ): ToChildPair

  @c4el("ArrowElement") def arrowElement(
    key: String,
    id: String,
    children: ViewRes,
    relations: List[ArrowRelation],
  ): ToChildPair

  @c4val def arrowRelation(
    targetId: String,
    targetAnchor: String,
    sourceAnchor: String,
    style: ArrowStyle,
  ): ArrowRelation

  @c4val def arrowStyle(
    strokeColor: String,
  ): ArrowStyle

  @c4el("XMLView") def xmlView(
    key: String,
    xml: String,
  ): ToChildPair

  @c4el("UserManualProvider") def userManualProvider(
    key: String,
    url: String,
    children: ViewRes = Nil,
  ): ToChildPair

  @c4el("LabeledElement") def labeledElement(
    key: String,
    label: String = "",
    children: ViewRes,
    labelChildren: ViewRes = Nil,
    sizes: Option[Size] = None,
    align: Option[Align] = None,
    umid: String = "",
    hint: Option[String] = None,
    goToChip: ViewRes = Nil,
  ): ToChildPair

  @c4el("DashboardCard") def dashboardCard(
    key: String,
    iconFieldItems: ViewRes,
    nameFieldItems: ViewRes,
    innerItems: ViewRes,
    rightButton: ViewRes,
  ): ToChildPair

  @c4el("Dashboard") def dashboard(
    key: String,
    minColWidth: Em,
    maxColWidth: Em,
    minScale: Em,
    maxScale: Em,
    rowGap: Em,
    colGap: Em,
    containerPaddingTop: Em = 0,
    containerPaddingLeft: Em = 0,
    cardsColor: Option[ColorDef] = None,
    children: ViewRes,
  ): ToChildPair

  @c4el("DashboardHeader") def dashboardHeader(
    key: String,
    heading: String,
    addButton: ViewRes,
  ): ToChildPair

  @c4el("Highlight") def highlight(
    key: String,
    children: ViewRes,
  ): ToChildPair

  @c4el("SecondWindowComponent") def secondWindowComponent(
    key: String,
    children: ViewRes,
  ): ToChildPair

  @c4el("SecondWindowOpener") def secondWindowOpener(
    key: String,
    children: ViewRes,
  ): ToChildPair

  @c4val def externalLoginOption(
    configId: String,
    title: String,
  ): ExternalLoginOption

  @c4el("ExternalLogin") def externalLogin(
    key: String,
    options: List[ExternalLoginOption]
  ): ToChildPair
}


