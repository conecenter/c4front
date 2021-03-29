package ee.cone.c4ui

import ee.cone.c4di._
import ee.cone.c4vdom.Types._
import ee.cone.c4vdom._

trait DatePicker extends ToChildPair
@c4tagSwitch("FrontApp") trait DatePickerState extends ToJson

@c4tags("FrontApp") trait DatePickerTags[C] {
  @c4el("DatePickerInputElement") def datePicker(
    key: String,
    state: DatePickerState,
    timestampFormatId: Int,
    userTimezoneId: String,
    receiver: Receiver[C],
    deferredSend: Boolean = false
  ): DatePicker

  @c4val("timestamp-state") def timeStampState(
    timestamp: Long
  ): DatePickerState

  @c4val("input-state") def inputState(
    inputValue: String,
    tempTimestamp: Long = 0L
  ): DatePickerState
}
