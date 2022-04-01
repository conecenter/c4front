package ee.cone.c4ui

import ee.cone.c4vdom.Types.ViewRes
import ee.cone.c4vdom.{ToChildPair, ToJson, c4el, c4tagSwitch, c4tags, c4val}

@c4tagSwitch("FrontApp") trait ColorDef extends ToJson

trait InlineElement extends ToChildPair

@c4tags("FrontApp") trait InlineElementsTags {
  @c4val("p") def paletteColor(
    cssClass: String,
  ): ColorDef

  @c4val("r") def rawColor(
    bgColor: String,
    textColor: String,
  ): ColorDef

  @c4el("InlineButton") def inlineButton(
    key: String,
    color: ColorDef,
    children: ViewRes,
  ): InlineElement

  @c4el("InlineChip") def inlineChip(
    key: String,
    color: ColorDef,
    children: ViewRes,
  ): InlineElement
}
