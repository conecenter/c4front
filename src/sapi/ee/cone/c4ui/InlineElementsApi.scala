package ee.cone.c4ui

import ee.cone.c4vdom.Types.ViewRes
import ee.cone.c4vdom.{Receiver, ToChildPair, c4el, c4tags}

trait InlineElement extends ToChildPair

@c4tags("FrontApp") trait InlineElementsTags[C] {

  @c4el("InlineButton") def inlineButton(
    key: String,
    color: ColorDef,
    children: ViewRes,
    receiver: Receiver[C] = NoReceiver[C],
  ): InlineElement

  @c4el("InlineChip") def inlineChip(
    key: String,
    color: ColorDef,
    children: ViewRes,
    receiver: Receiver[C] = NoReceiver[C],
  ): InlineElement
}
