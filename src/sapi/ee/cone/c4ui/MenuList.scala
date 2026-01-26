package ee.cone.c4ui

import ee.cone.c4vdom.Types.ElList
import ee.cone.c4vdom.{Receiver, ToChildPair, c4el, c4tags}

trait MenuListItem extends ToChildPair

@c4tags("FrontApp") trait MenuListTags[C] {
  @c4el("MenuList") def menuList(
    key: String,
    children: ElList[MenuListItem]
  ): ToChildPair

  @c4el("MenuListItem") def menuListItem(
    key: String,
    name: String,
    iconPath: String = "",
    tooltip: String = "",
    receiver: Receiver[C]
  ): MenuListItem
}