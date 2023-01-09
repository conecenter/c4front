package ee.cone.c4ui

import ee.cone.c4vdom.{ToChildPair, ToJson, c4el, c4tagSwitch, c4tags, c4val}

@c4tagSwitch("FrontApp") trait ColorDef extends ToJson

@c4tagSwitch("FrontApp") trait Row extends ToJson

@c4tagSwitch("FrontApp") trait Text extends ToJson

@c4tags("FrontApp") trait CommonElementsTags {
  @c4val("p") def paletteColor(
    cssClass: String,
  ): ColorDef

  @c4val("r") def rawColor(
    bgColor: String,
    textColor: String,
  ): ColorDef

  @c4val("text") def textElement(
    text: String,
    color: Option[ColorDef] = None,
  ): Text

  @c4val("row") def rowElement(
    text: List[Text],
  ): Row

  @c4el("RichTextElement") def richTextElement(
    key: String,
    text: List[Row],
    color: Option[ColorDef] = None
  ): ToChildPair
}
