package ee.cone.c4ui

import ee.cone.c4ui.FrontTypes.Em
import ee.cone.c4vdom.Types.ViewRes
import ee.cone.c4vdom.{ToChildPair, ToJson, c4el, c4tagSwitch, c4tags, c4val}

@c4tagSwitch("FrontApp") trait ColorDef extends ToJson

@c4tagSwitch("FrontApp") trait Row extends ToJson

@c4tagSwitch("FrontApp") trait Text extends ToJson

@c4tagSwitch("FrontApp") trait FontStyle extends ToJson

@c4tags("FrontApp") trait CommonElementsTags {
  @c4val("p") def paletteColor(
    cssClass: String,
  ): ColorDef

  @c4val("r") def rawColor(
    bgColor: String,
    textColor: String,
  ): ColorDef

  @c4val("b") def bold: FontStyle
  @c4val("i") def italic: FontStyle
  @c4val("m") def monospace: FontStyle

  @c4val("text") def textElement(
    text: String,
    fontStyle: List[FontStyle] = Nil,
    fontSize: Option[Em] = None,
    color: Option[ColorDef] = None,
  ): Text

  @c4val("row") def rowElement(
    row: List[Text],
  ): Row

  @c4el("RichTextElement") def richTextElement(
    key: String,
    text: List[Row],
    color: Option[ColorDef] = None
  ): ToChildPair

  @c4el("SystemButtonsSet") def systemButtons(
    key: String,
    children: ViewRes,
    align: Option[Align] = None,
  ): ToChildPair

  @c4el("TreeNode") def treeNode(
    key: String,
    level: Int,
    children: ViewRes,
  ): ToChildPair

  @c4el("BottomBarElement") def bottomBarElement(
    key: String,
    id: String,
    align: Option[Align] = None,
    priority: Option[Int] = None,
    children: ViewRes
  ): ToChildPair

  @c4el("AutoFocusBlocker") def autoFocusBlocker(
    key: String,
  ): ToChildPair

  @c4el("ExternalApplication") def externalApplication(
    key: String,
    url: String,
    hidden: Boolean = false,
  ): ToChildPair

  @c4el("SplitButton") def splitButton(
    key: String,
    mainButton: ViewRes,  // ButtonElement
    color: ColorDef,
    optionalGroup: ViewRes,
  ): ToChildPair
}
