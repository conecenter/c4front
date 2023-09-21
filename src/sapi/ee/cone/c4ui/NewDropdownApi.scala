package ee.cone.c4ui

import ee.cone.c4vdom.Types.ViewRes
import ee.cone.c4vdom.{Receiver, ToChildPair, ToJson, c4el, c4elPath, c4tagSwitch, c4tags, c4val}


@c4tagSwitch("FrontApp") trait DropdownOption extends ToJson

sealed trait DropdownContent extends ToJson

@c4tagSwitch("FrontApp") trait CommonDropdownContent extends DropdownContent
@c4tagSwitch("FrontApp") trait TextDropdownContent extends CommonDropdownContent
@c4tagSwitch("FrontApp") trait ChipDropdownContent extends CommonDropdownContent
@c4tagSwitch("FrontApp") trait RouteDropdownContent extends CommonDropdownContent

@c4tags("FrontApp") trait NewDropdownTags[C] {
  @c4el("DropdownProps") def dropDown(
    key: String,
    options: List[DropdownOption],
    inputValue: DropdownOption,
    changing: Boolean = false,
    placeholder: String = "",
    children: ViewRes = Nil,
    receiver: Receiver[C],
  ): ToChildPair

  @c4val("Option") def option(
    srcId: String,
    text: String,
    content: List[CommonDropdownContent],
    recent: Boolean = false,
  ): DropdownOption

  @c4val("Text") def text(
    text: String,
  ): TextDropdownContent

  @c4val("Chip") def chip(
    text: String,
    color: ColorDef,
  ): ChipDropdownContent

  @c4val("Route") def route(
    routeParts: List[ChipDropdownContent],
    compact: Boolean = false,
    extraParts: List[ChipDropdownContent] = Nil,
  ): RouteDropdownContent
}