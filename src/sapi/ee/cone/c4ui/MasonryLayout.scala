package ee.cone.c4ui

import ee.cone.c4vdom.Types.ViewRes
import ee.cone.c4vdom.{Receiver, ToChildPair, ToJson, c4el, c4tagSwitch, c4tags, c4val}

@c4tagSwitch("FrontApp") trait Breakpoint extends ToJson

@c4tagSwitch("FrontApp") trait Col extends ToJson

@c4tagSwitch("FrontApp") trait Layout extends ToJson

@c4tagSwitch("FrontApp") trait BreakpointLayout extends ToJson

@c4tags("FrontApp") trait MasonryLayout[C] {
  @c4val def breakpoint(
    lg: Int,
    md: Int,
    sm: Int,
    xs: Int,
  ): Breakpoint

  @c4val def col(
    lg: Int,
    md: Int,
    sm: Int,
    xs: Int,
  ): Col

  @c4val def layout(
    i: String,
    x: Int,
    y: Int,
    w: Int,
    h: Int,
    minW: Int,
  ): Layout

  @c4val def breakpointLayout(
    lg: List[Layout],
    md: List[Layout],
    sm: List[Layout],
    xs: List[Layout],
  ): BreakpointLayout

  @c4el("MasonryLayout") def masonryLayout(
    key: String,
    layout: BreakpointLayout,
    breakpoints: Breakpoint,
    cols: Col,
    edit: Boolean = false,
    children: ViewRes,
    receiver: Receiver[C] = NoReceiver[C],
  ): ToChildPair
}
