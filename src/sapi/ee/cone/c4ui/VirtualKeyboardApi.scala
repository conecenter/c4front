package ee.cone.c4ui

import ee.cone.c4ui.FrontTypes.Em
import ee.cone.c4vdom.{ToChildPair, ToJson, c4el, c4tagSwitch, c4tags, c4val}

@c4tagSwitch("FrontApp") trait KeyboardPosition extends ToJson

@c4tagSwitch("FrontApp") trait KeyboardType extends ToJson

@c4tagSwitch("FrontApp") trait KeyboardMode extends ToJson

@c4tagSwitch("FrontApp") trait Key extends ToJson


@c4tags("FrontApp") trait VirtualKeyboardElements {

  @c4val("left") def left: KeyboardPosition
  @c4val("right") def right: KeyboardPosition
  @c4val("bottom") def bottom: KeyboardPosition
  @c4val("static") def static: KeyboardPosition

  @c4val def key(
    key: String,
    symbol: String = "",
    column: Em,
    row: Em,
    width: Option[Em],
    height: Option[Em],
    color: ColorDef,
  ): Key

  @c4val def keyboardMode(
    keys: List[Key],
  ): KeyboardMode

  @c4val def keyboardType(
    name: String,
    modes: List[KeyboardMode],
  ): KeyboardType

  @c4el("VirtualKeyboard") def virtualKeyboard(
    key: String, //VDomKey
    keyboardTypes: List[KeyboardType],
    position: KeyboardPosition,
  ): ToChildPair
}

