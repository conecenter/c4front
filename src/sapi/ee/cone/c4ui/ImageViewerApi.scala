package ee.cone.c4ui

import ee.cone.c4vdom.{Receiver, ToChildPair, ToJson, c4el, c4tagSwitch, c4tags, c4val}

@c4tagSwitch("FrontApp") trait Slide extends ToJson

@c4tags("FrontApp") trait ImageViewerTags[C] {
  @c4val def slide(
    src: String,
    title: String = "",
  ): Slide

  @c4el("ImageViewer") def imageViewer(
    key: String,
    index: Int,
    slides: List[Slide] = Nil,
    slideChange: Receiver[C] = NoReceiver[C]
  ): ToChildPair
}
