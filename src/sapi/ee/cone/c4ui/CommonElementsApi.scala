package ee.cone.c4ui

import ee.cone.c4vdom.{ToJson, c4tagSwitch, c4tags, c4val}

@c4tagSwitch("FrontApp") trait ColorDef extends ToJson

@c4tags("FrontApp") trait CommonElementsTags {
  @c4val("p") def paletteColor(
    cssClass: String,
  ): ColorDef

  @c4val("r") def rawColor(
    bgColor: String,
    textColor: String,
  ): ColorDef

}
