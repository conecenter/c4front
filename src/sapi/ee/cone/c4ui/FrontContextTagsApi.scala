package ee.cone.c4ui

import ee.cone.c4vdom.Types._
import ee.cone.c4vdom._

@c4tagSwitch("FrontApp") trait PivotGeneralElement extends ToJson

@c4tagSwitch("FrontApp") trait PivotField extends PivotGeneralElement

@c4tagSwitch("FrontApp") trait PivotFieldsGroup extends PivotGeneralElement

@c4tagSwitch("FrontApp") trait UiType extends ToJson

@c4tags("FrontApp") trait FrontContextTags[C] {
  @c4el("ColorPicker") def colorPicker(
    key: String,
    value: String,
    ro: Boolean = false,
    receiver: Receiver[C] = NoReceiver[C]
  ): ToChildPair

  @c4el("RichTextEditor") def richTextEditor(
    key: String,
    contentState: String,
    selectionState: String,
    toolbar: List[String],
    disabled: Boolean,
    receiver: Receiver[C],
    children: ViewRes,
  ): ToChildPair

  @c4el("PivotSettings") def pivotSettings(
    key: String,
    fields: List[PivotGeneralElement],
    pivotFilters: List[PivotField],
    pivotBreaks: List[PivotField],
    pivotRows: List[PivotField],
    pivotColumns: List[PivotField],
    pivotData: List[PivotField],
    pivotCells: List[PivotField],
    receiver: Receiver[C],
  ): ToChildPair

  @c4val def pivotField(
    id: String,
    name: String,
    selected: Boolean,
    fieldType: Option[String],
    invalid: Boolean = false,
    prefix: Option[String] = None,
  ): PivotField

  @c4val def pivotFieldsGroup(
    groupName: String,
    fields: List[PivotField],
  ): PivotFieldsGroup

  @c4val("pointer") def pointer: UiType
  @c4val("touch") def touch: UiType

  @c4el("CheckboxElement") def checkBox(
    key: String,
    label: Option[String] = None,
    value: String,
    receiver: Receiver[C],
    children: ViewRes,
    tooltip: Option[String] = None,
    classNames: List[CSSClassName] = Nil,
  ): ToChildPair

  @c4el("RadioButtonElement") def radioButtonElement(
    key: String,
    label: Option[String],
    value: String,
    receiver: Receiver[C],
    tooltip: Option[String] = None,
    classNames: List[CSSClassName] = Nil,
    children: ViewRes = Nil,
  ): ToChildPair

  @c4el("UiInfoProvider") def uiInfoProvider(
    key: String,
    uiType: Option[UiType],
    children: ViewRes,
    receiver: Receiver[C],
  ): ToChildPair

  @c4el("ScannerSerialElement") def scannerSerialElement(
    key: String,
    barcodeReader: Boolean,
    children: ViewRes,
    barcodeAction: Receiver[C] = NoReceiver[C]
  ): ToChildPair

  @c4el("YamlEditor") def yamlEditor(
    key: String,
    value: String,
    jsonSchema: Option[String],
    receiver: Receiver[C],
  ): ToChildPair
}
