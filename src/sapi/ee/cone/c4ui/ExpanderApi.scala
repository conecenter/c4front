package ee.cone.c4ui

import ee.cone.c4vdom.Types.{ChildPairList, ElList}
import ee.cone.c4vdom.{OfDiv, ToChildPair, ToJson, c4el, c4tagSwitch, c4tags, c4val}

@c4tagSwitch("FrontApp") trait ExpanderAreaSide extends ToJson
trait Expander extends ToJson
@c4tags("FrontApp") trait ExpanderTags {
  @c4el("ExpanderArea") def expanderArea(
    key: String,
    expandTo: ElList[Expander] = Nil,
    maxLineCount: Int = 0,
  ): ToChildPair
  @c4el("Expander") def expander(
    key: String,
    area: ExpanderAreaSide,
    children: ChildPairList[OfDiv] = Nil,
    expandTo: ElList[Expander] = Nil,
    expandOrder: Int = 0,
  ): Expander
  @c4val("lt") def leftSide: ExpanderAreaSide
  @c4val("ct") def centerSide: ExpanderAreaSide
  @c4val("rt") def rightSide: ExpanderAreaSide
}
