import {createElement as el, ReactNode} from "react";
import {ColorDef, colorToProps} from "./common-api";
import {useClickSyncOpt} from "../exchange/click-sync";
import clsx from "clsx";
import {CLICKED_CLASSNAME, INLINE_BUTTON_CLASSNAME, INLINE_CHIP_CLASSNAME} from "./css-classes";

interface InlineButton {
  key: string,
  identity: Object
  receiver: boolean
  color: ColorDef
  children: ReactNode[]

}

function InlineButton({key, identity, receiver, color, children}: InlineButton) {
  const {clicked, onClick} = useClickSyncOpt(identity, "receiver", receiver)
  const {style, className} = colorToProps(color)
  return el("button", {
    style,
    onClick,
    className: clsx(className, INLINE_BUTTON_CLASSNAME, clicked && CLICKED_CLASSNAME)
  }, children)
}

interface InlineChip {
  key: string
  identity: Object
  receiver: boolean
  color: ColorDef
  children: ReactNode[]
}

function InlineChip({key, identity, receiver, color, children}: InlineButton) {
  const {clicked, onClick} = useClickSyncOpt(identity, "receiver", receiver)
  const {style, className} = colorToProps(color)
  return el("div", {
    style,
    onClick,
    className: clsx(className, INLINE_CHIP_CLASSNAME, clicked && CLICKED_CLASSNAME)
  }, children)
}


export const inlineComponents = {InlineButton, InlineChip}
