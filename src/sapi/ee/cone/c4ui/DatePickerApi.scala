package ee.cone.c4ui

import ee.cone.c4di._
import ee.cone.c4vdom.Types._
import ee.cone.c4vdom._

trait DatePicker extends ToChildPair

@c4tagSwitch("FrontApp") trait Locale extends ToJson
@c4tagSwitch("FrontApp") trait WeekDay extends ToJson
@c4tagSwitch("FrontApp") trait Month extends ToJson
@c4tagSwitch("FrontApp") trait DateTimeFormat extends ToJson

@c4tagSwitch("FrontApp") trait DatePickerState extends ToJson

@c4tags("FrontApp") trait DatePickerTags[C] {
  @c4el("DatePickerInputElement") def datePicker(
    key: String,
    state: DatePickerState,
    timestampFormatId: Int,
    receiver: Receiver[C],
    userTimezoneId: String = "",
    deferredSend: Boolean = false
  ): DatePicker

  @c4val("timestamp-state") def timeStampState(
    timestamp: String,
    popupDate: String = "",
  ): DatePickerState

  @c4val("input-state") def inputState(
    inputValue: String,
    tempTimestamp: String = "",
    popupDate: String = "",
  ): DatePickerState
}

@c4tags("FrontApp") trait LocaleTags {
  @c4el("UserLocaleProvider") def localeProvider(
    key: String,
    locale: Locale,
    children: ChildPairList[OfDiv] = Nil,
  ): ToChildPair

  @c4val def locale(
    timezoneId: String,
    shortName: String,
    weekDays: List[WeekDay],
    months: List[Month],
    dateTimeFormats: List[DateTimeFormat],
    defaultDateTimeFormatId: Int
  ): Locale

  @c4val def weekDay(
    id: Int,
    shortName: String,
    fullName: String,
  ): WeekDay

  @c4val def month(
    id: Int,
    shortName: String,
    fullName: String,
  ): Month

  @c4val def dateTimeFormat(
    id: Int,
    pattern: String
  ): DateTimeFormat
}
