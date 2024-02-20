package ee.cone.c4ui

import ee.cone.c4vdom.Types.ViewRes
import ee.cone.c4vdom.{ToChildPair, c4el, c4tags}


@c4tags("FrontApp") trait ContextsProviderTags {
  @c4el("ContextsProvider") def contextsProvider(
    key: String,
    children: ViewRes,
  ): ToChildPair
}
