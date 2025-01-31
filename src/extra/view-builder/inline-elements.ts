import {createElement as el, ReactNode} from "react";
import {ColorDef, colorToProps} from "./common-api";
import {useClickSyncOpt} from "../exchange/click-sync";
import clsx from "clsx";
import {CLICKED_CLASSNAME, INLINE_BUTTON_CLASSNAME, INLINE_CHIP_CLASSNAME} from "./css-classes";
import {identityAt} from "../../main/vdom-util";

const receiverIdOf = identityAt('receiver');

interface InlineButton {
  key: string,
  identity: object
  receiver: boolean
  color: ColorDef
  children: ReactNode[]

}

function InlineButton({identity, receiver, color, children}: InlineButton) {
  const {clicked, onClick} = useClickSyncOpt(receiverIdOf(identity), receiver)
  const {style, className} = colorToProps(color)
  return el("button", {
    style,
    onClick,
    className: clsx(className, INLINE_BUTTON_CLASSNAME, clicked && CLICKED_CLASSNAME)
  }, children)
}

interface InlineChip {
  key: string
  identity: object
  receiver: boolean
  color: ColorDef
  children: ReactNode[]
}

function InlineChip({identity, receiver, color, children}: InlineButton) {
  const {clicked, onClick} = useClickSyncOpt(receiverIdOf(identity), receiver)
  const {style, className} = colorToProps(color)
  return el("div", {
    style,
    onClick,
    className: clsx(className, INLINE_CHIP_CLASSNAME, clicked && CLICKED_CLASSNAME)
  }, children)
}


export const inlineComponents = {InlineButton, InlineChip}
