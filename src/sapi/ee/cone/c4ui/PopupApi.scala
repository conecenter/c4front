package ee.cone.c4ui

import ee.cone.c4vdom.Types.ViewRes
import ee.cone.c4vdom.{Receiver, ToChildPair, c4elPath, c4tags}


@c4tags("FrontApp") trait PopupTags[C] {
  @c4elPath("SyncedPopup") def syncedPopup(
    key: String,
    children: ViewRes,
    receiver: Receiver[C] = NoReceiver[C],
  ): ToChildPair

  @c4elPath("PopupElement") def popupElement(
    key: String,
    popupKey: String,
    children: ViewRes
  ): ToChildPair
}
