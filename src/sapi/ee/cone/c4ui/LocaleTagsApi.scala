package ee.cone.c4ui

import ee.cone.c4di._
import ee.cone.c4ui.Types.FNumber
import ee.cone.c4vdom.Types._
import ee.cone.c4vdom._

@c4tagSwitch("FrontApp") trait Locale extends ToJson
@c4tagSwitch("FrontApp") trait WeekDay extends ToJson
@c4tagSwitch("FrontApp") trait Month extends ToJson
@c4tagSwitch("FrontApp") trait DateTimeFormat extends ToJson
@c4tagSwitch("FrontApp") trait TimeFormat extends ToJson
@c4tagSwitch("FrontApp") trait NumberFormat extends ToJson

trait DatePickerProps extends ToChildPair
sealed trait DatePickerServerState extends ToJson
@c4tagSwitch("FrontApp") trait PopupServerState extends DatePickerServerState
@c4tagSwitch("FrontApp") trait TimestampServerState extends PopupServerState
@c4tagSwitch("FrontApp") trait InputServerState extends PopupServerState

trait NumberInputProps extends ToChildPair
@c4tagSwitch("FrontApp")  trait NumberInputServerState extends ToJson
@c4tagSwitch("FrontApp") trait InputNumberServerState extends NumberInputServerState
@c4tagSwitch("FrontApp") trait NumberNumberServerState extends NumberInputServerState

trait TimePickerProps extends ToChildPair
@c4tagSwitch("FrontApp") trait TimePickerState extends ToJson
@c4tagSwitch("FrontApp") trait InputTimePickerState extends TimePickerState
@c4tagSwitch("FrontApp") trait TimestampTimePickerState extends TimePickerState

@c4tags("FrontApp") trait LocaleInputTags[C] {
  @c4elPath("DatePickerInputElement") def datePicker(
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

  @c4elPath("NumberFormattingInput") def numberInput(
    key: String,
    state: NumberInputServerState,
    showThousandSeparator: Boolean,
    scale: Int,
    minFraction: Int,
    receiver: Receiver[C],
    placeholder: Option[String] = None,
    children: ViewRes = Nil
  ): NumberInputProps

  @c4val("number-state") def numberState(
    number: String,
  ): NumberNumberServerState

  @c4val("input-state") def inputNumberState(
    inputValue: String,
    tempNumber: String = "",
  ): InputNumberServerState

  @c4el("TimePicker") def timePicker(
    key: String,
    state: TimePickerState,
    offset: Option[Int] = None,
    timestampFormatId: Int,
    receiver: Receiver[C],
    deferredSend: Boolean = false,
    children: ViewRes = Nil,
  ): TimePickerProps

  @c4val("timestamp-state") def timepickerTimestampState(
    timestamp: Int,
  ): TimestampTimePickerState

  @c4val("input-state") def timepickerInputState(
    inputValue: String,
    tempTimestamp: Option[Int] = None,
  ): InputTimePickerState
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
    lang: String = "",
    weekDays: List[WeekDay],
    months: List[Month],
    dateTimeFormats: List[DateTimeFormat],
    timeFormats: List[TimeFormat],
    defaultDateTimeFormatId: Int,
    numberFormat: NumberFormat
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

  @c4val def numberFormat(
    thousandSeparator: String,
    decimalSeparator: String
  ): NumberFormat
}
