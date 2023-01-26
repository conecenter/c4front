package ee.cone.c4ui

import ee.cone.c4vdom.{Receiver, ToChildPair, c4el, c4tags}

@c4tags("FrontApp") trait ChipElementTags[C] {
  @c4el("ChipElement") def chip(
    key: String,
    text: String,
    color: ColorDef,
    tooltip: String = "",
    iconPath: String = "",
    link: String = "",
    receiver: Receiver[C] = NoReceiver[C],
    withDelete: Boolean = false,
  ): ToChildPair
}
