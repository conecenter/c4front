
package ee.cone.c4ui

import ee.cone.c4di._
import ee.cone.c4vdom._

@c4tags("FrontApp") trait MjpegTags {
  @c4el("CamView") def camView(
    key: String,
    url: String,
    height: Int,
  ): ToChildPair
}