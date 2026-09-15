package ee.cone.c4ui

import ee.cone.c4vdom.Types._
import ee.cone.c4vdom._

trait MenuBar extends ToChildPair

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
    icon: Option[String] = None,
    leftChildren: ElList[MenuItem],
    rightChildren: ElList[MenuItem],
  ): MenuBar

  @c4elPath("MenuFolderItem") def menuFolderItem(
    key: String,
    name: String,
    current: Boolean,
    popupKey: String,
    icon: Option[String] = None,
    children: ElList[MenuInnerItem],
    bindSrcId: String,
    groupId: String,
  ): MenuFolderItem

  @c4elPath("MenuExecutableItem") def menuExecutableItem(
    key: String,
    name: String,
    current: Boolean,
    icon: Option[String] = None,
    receiver: Receiver[C],
    bindSrcId: String,
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
    popupKey: String,
    icon: Option[String] = None,
    children: ElList[MenuInnerItem],
    bindSrcId: String,
    groupId: String,
  ): MenuUserItem

  @c4elPath("MainMenuClock") def mainMenuClock(
    key: String,
    serverTime: String,
    timestampFormatId: Int,
    timeSync: Receiver[C],
  ): MainMenuClock
}
