package ee.cone.c4ui

import ee.cone.c4vdom.Types.ViewRes
import ee.cone.c4vdom.{Receiver, ToChildPair, ToJson, c4el, c4tagSwitch, c4tags, c4val}

@c4tagSwitch("FrontApp") trait CalendarEvent extends ToJson {
  def id: String
  def key: String = id
}

@c4tagSwitch("FrontApp") trait ViewInfo extends ToJson

@c4tagSwitch("FrontApp") trait BusinessHours extends ToJson

@c4tagSwitch("FrontApp") trait TimeRange extends ToJson

@c4tagSwitch("FrontApp") trait Resource extends ToJson

@c4tagSwitch("FrontApp") trait ViewInfoType extends ToJson
@c4tags("FrontApp") trait CalendarTags[C] {
  @c4el("Calendar") def calendar(
    key: String,
    events: List[CalendarEvent],
    currentView: Option[ViewInfo] = None,
    slotDuration: Option[String] = None,
    businessHours: Option[BusinessHours] = None,
    allDaySlot: Option[Boolean] = None,
    timeSlotsRange: Option[TimeRange] = None,
    eventsChildren: ViewRes,
    resources: List[Resource] = Nil,
    changeView: Receiver[C] = NoReceiver[C],
    changeEvent: Receiver[C] = NoReceiver[C],
    clickAction: Receiver[C] = NoReceiver[C],
  ): ToChildPair

  @c4el("CalendarEvent") def calendarEvent(
    id: String,
    start: Option[String] = None,
    end: Option[String] = None,
    title: Option[String] = None,
    allDay: Option[Boolean] = None,
    color: Option[ColorDef] = None,
    editable: Option[Boolean] = None,
    resourceIds: List[String] = Nil,
    resourceEditable: Option[Boolean] = None,
  ): CalendarEvent

  @c4val("dayGridMonth") def dayGridMonth: ViewInfoType
  @c4val("timeGridWeek") def timeGridWeek: ViewInfoType
  @c4val("timeGridDay") def timeGridDay: ViewInfoType
  @c4val("resourceTimeGridDay") def resourceTimeGridDay: ViewInfoType

  @c4val def viewInfo(
    viewType: ViewInfoType,
    from: String,
    to: String,
  ): ViewInfo

  @c4val def businessHours(
    daysOfWeek: List[Int], // 0 - sunday
    startTime: String,
    endTime: String,
  ): BusinessHours

  @c4val def timeRange(
    from: String,
    to: String,
  ): TimeRange

  @c4val def resource(
    id: String,
    title: String
  ): Resource
}