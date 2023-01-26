package ee.cone.c4ui

import ee.cone.c4vdom.Types.ViewRes
import ee.cone.c4vdom.{Receiver, ToChildPair, c4el, c4tags, c4val}
import ee.cone.core.ui.c4view._front.RoutePartData


@c4tags("FrontApp") trait RouteElementTags[C] {
  @c4el("RouteElement") def routeElement(
    key: String,
    compact: Boolean = false,
    routeParts: List[RoutePartData],
    receiver: Receiver[C] = NoReceiver[C],
    children: ViewRes = Nil,
  ): ToChildPair

  @c4val("RoutePartData") def routePart(
    text: String,
    done: Boolean,
    hint: String = "",
  ): RoutePartData
}
