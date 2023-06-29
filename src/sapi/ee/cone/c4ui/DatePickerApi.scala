package ee.cone.c4ui

import ee.cone.c4di._
import ee.cone.c4vdom.Types._
import ee.cone.c4vdom._

trait DatePickerProps extends ToChildPair

@c4tagSwitch("FrontApp") trait Locale extends ToJson
@c4tagSwitch("FrontApp") trait WeekDay extends ToJson
@c4tagSwitch("FrontApp") trait Month extends ToJson
@c4tagSwitch("FrontApp") trait DateTimeFormat extends ToJson
@c4tagSwitch("FrontApp") trait TimeFormat extends ToJson

sealed trait DatepickerChange extends ToJson

sealed trait DatePickerServerState extends ToJson
@c4tagSwitch("FrontApp") trait PopupServerState extends DatePickerServerState
@c4tagSwitch("FrontApp") trait TimestampServerState extends PopupServerState
@c4tagSwitch("FrontApp") trait InputServerState extends PopupServerState

@c4tags("FrontApp") trait DatePickerTags[C] {
  @c4el("DatePickerInputElement") def datePicker(
    key: String,
    state: PopupServerState,
    timestampFormatId: Int,
    receiver: Receiver[C],
    userTimezoneId: String = "",
    deferredSend: Boolean = false,
    children: ViewRes = Nil,
  ): DatePickerProps

  @c4val("timestamp-state") def timeStampState(
    timestamp: String,
    popupDate: String = "",
  ): TimestampServerState

  @c4val("input-state") def inputState(
    inputValue: String,
    tempTimestamp: String = "",
    popupDate: String = "",
  ): InputServerState
}

@c4tags("FrontApp") trait LocaleTags {
  @c4el("UserLocaleProvider") def localeProvider(
    key: String,
    locale: Locale,
    children: ViewRes = Nil,
  ): ToChildPair

  @c4val def locale(
    timezoneId: String,
    shortName: String,
    weekDays: List[WeekDay],
    months: List[Month],
    dateTimeFormats: List[DateTimeFormat],
    timeFormats: List[TimeFormat],
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

  @c4val def timeFormat(
    id: Int,
    pattern: String,
  ): TimeFormat
}
