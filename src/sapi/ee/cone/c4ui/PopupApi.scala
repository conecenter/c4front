package ee.cone.c4ui

import ee.cone.c4vdom.Types.ViewRes
import ee.cone.c4vdom.{ToChildPair, c4el, c4tags}


@c4tags("FrontApp") trait PopupTags[C] {
  @c4el("PopupElement") def popupElement(
    key: String,
    popupKey: String,
    children: ViewRes,
    forceOverlay: Boolean = false,
  ): ToChildPair
}
