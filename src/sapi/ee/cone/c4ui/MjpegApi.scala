
package ee.cone.c4ui

import ee.cone.c4vdom.{ToChildPair, c4el, c4tags}

@c4tags("FrontApp") trait MjpegTags {
  @c4el("CamView") def camView(
    key: String,
    url: String,
  ): ToChildPair
}