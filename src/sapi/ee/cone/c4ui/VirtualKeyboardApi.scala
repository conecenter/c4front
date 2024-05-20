package ee.cone.c4ui

import ee.cone.c4vdom.{Receiver, ToChildPair, ToJson, c4el, c4tagSwitch, c4tags, c4val}

@c4tagSwitch("FrontApp") trait KeyboardPosition extends ToJson

@c4tagSwitch("FrontApp") trait KeyboardType extends ToJson

@c4tagSwitch("FrontApp") trait SwitchedMode extends ToJson

@c4tags("FrontApp") trait VirtualKeyboardTags[C] {

  @c4val("left") def left: KeyboardPosition
  @c4val("right") def right: KeyboardPosition
  @c4val("bottom") def bottom: KeyboardPosition
  @c4val("static") def static: KeyboardPosition // draw keyboard as-is, where it's been placed

  @c4val def switchedMode(
    vkType: String,
    mode: Int,
  ): SwitchedMode

  @c4el("VirtualKeyboard") def virtualKeyboard(
    key: String, // VDomKey
    hash: String, // hash of a published json file with the rest of the keyboard
    setupMode: Boolean = false,
    setupType: String = "", // Name of the keyboard type to set-up (only setup mode)
    position: KeyboardPosition,
    receiver: Receiver[C] = NoReceiver[C],
    switchedMode: List[SwitchedMode] = Nil
  ): ToChildPair
}

