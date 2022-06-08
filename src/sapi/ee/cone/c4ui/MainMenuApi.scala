package ee.cone.c4ui

import ee.cone.c4di._
import ee.cone.c4vdom.Types._
import ee.cone.c4vdom._

trait MenuBar extends ToChildPair

@c4tagSwitch("FrontApp") trait MenuItemState extends ToJson {
  def opened: Boolean
}

sealed trait MenuInnerItem extends ToChildPair

sealed trait MenuItem extends MenuInnerItem

trait MenuFolderItem extends MenuItem

trait MenuExecutableItem extends MenuItem

trait MenuCustomItem extends MenuItem

trait MenuItemsGroup extends MenuInnerItem

trait MenuUserItem extends MenuItem

trait MainMenuClock extends MenuItem

@c4tags("FrontApp") trait MainMenuTags[C] {
  @c4el("MainMenuBar") def menuBar(
    key: String,
    state: MenuItemState,
    icon: Option[String] = None,
    leftChildren: ElList[MenuItem],
    rightChildren: ElList[MenuItem],
    receiver: Receiver[C],
  ): MenuBar

  @c4val def menuItemState(
    opened: Boolean
  ): MenuItemState

  @c4elPath("MenuFolderItem") def menuFolderItem(
    key: String,
    name: String,
    current: Boolean,
    state: MenuItemState,
    icon: Option[String] = None,
    children: ElList[MenuInnerItem],
    receiver: Receiver[C],
  ): MenuFolderItem

  @c4elPath("MenuExecutableItem") def menuExecutableItem(
    key: String,
    name: String,
    current: Boolean,
//    state: MenuItemState,
    icon: Option[String] = None,
    receiver: Receiver[C],
  ): MenuExecutableItem

  @c4elPath("MenuCustomItem") def menuCustomItem(
    key: String,
    children: ViewRes,
  ): MenuCustomItem

  @c4el("MenuItemsGroup") def menuItemsGroup(
    key: String,
    children: ElList[MenuItem],
  ): MenuItemsGroup

  @c4elPath("MenuUserItem") def menuUserItem(
    key: String,
    shortName: String,
    longName: String,
    current: Boolean,
    state: MenuItemState,
    icon: Option[String] = None,
    children: ElList[MenuInnerItem],
    receiver: Receiver[C],
  ): MenuUserItem

  @c4el("MainMenuClock") def mainMenuClock(
    key: String,
    serverTime: String,
    timestampFormatId: Int,
    timeSync: Receiver[C],
  ): MainMenuClock
}
