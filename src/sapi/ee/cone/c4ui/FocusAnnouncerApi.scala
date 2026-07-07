package ee.cone.c4ui

import ee.cone.c4vdom.Types.ViewRes
import ee.cone.c4vdom.{ProtocolReceiver, ToChildPair, c4elPath, c4msg, c4msgSwitch, c4tags}

@c4msgSwitch("FrontApp") sealed trait FocusAnnouncerMsg

@c4msg(action = "change", body = "focusPath")
final case class FocusChanged(focusPath: String) extends FocusAnnouncerMsg

@c4tags("FrontApp") trait FocusAnnouncerTags[C] {
  @c4elPath("FocusAnnouncerElement") def focusAnnouncer(
    key: String,
    value: String,
    receiver: ProtocolReceiver[C, FocusAnnouncerMsg],
    children: ViewRes,
  ): ToChildPair
}
