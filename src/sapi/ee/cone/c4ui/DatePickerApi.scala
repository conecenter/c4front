package ee.cone.c4ui

import ee.cone.c4di._
import ee.cone.c4vdom.Types._
import ee.cone.c4vdom._

trait DatePicker extends ToChildPair

@c4tags("FrontApp") trait DatePickerTags[C] {
  @c4el("DatePickerInputElement") def datePicker(
    key: String,
    timestampFormatId: Int,
    state: String,
    userTimezoneId: String
  ): DatePicker
}
