package ee.cone.c4ui

import ee.cone.c4vdom.Types.ViewRes
import ee.cone.c4vdom.{Receiver, ToChildPair, c4elPath, c4tags}


@c4tags("FrontApp") trait FocusAnnouncerTags[C] {
  @c4elPath("FocusAnnouncerElement") def focusAnnouncer(
    key: String,
    value: String,
    receiver: Receiver[C],
    children: ViewRes,
  ): ToChildPair
}
