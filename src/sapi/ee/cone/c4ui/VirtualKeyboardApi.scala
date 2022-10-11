package ee.cone.c4ui

import ee.cone.c4vdom.{Receiver, ToChildPair, ToJson, c4el, c4tagSwitch, c4tags, c4val}

@c4tagSwitch("FrontApp") trait KeyboardPosition extends ToJson

@c4tagSwitch("FrontApp") trait KeyboardType extends ToJson

@c4tags("FrontApp") trait VirtualKeyboardElements {

  @c4val("left") def left: KeyboardPosition
  @c4val("right") def right: KeyboardPosition
  @c4val("bottom") def bottom: KeyboardPosition
  @c4val("static") def static: KeyboardPosition // draw keyboard as-is, where it's been placed

  @c4el("VirtualKeyboard") def virtualKeyboard(
    key: String, // VDomKey
    hash: String, // hash of a published json file with the rest of the keyboard
    setupType: String = "", // Name of the keyboard type to set-up (only setup mode)
    position: KeyboardPosition,
  ): ToChildPair
}

