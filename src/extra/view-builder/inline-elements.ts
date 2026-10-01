import {createElement as el} from "react";
import {colorToProps} from "./common-api";
import {useClickSyncOpt} from "../exchange/click-sync";
import clsx from "clsx";
import {CLICKED_CLASSNAME, INLINE_BUTTON_CLASSNAME, INLINE_CHIP_CLASSNAME} from "./css-classes";
import {identityAt} from "../../main/vdom-util";
import { InlineButtonProps, InlineChipProps } from "types/c4gen.InlineElementsApi";

const receiverIdOf = identityAt('receiver');


function InlineButton({identity, receiver, color, children}: InlineButtonProps) {
  const {clicked, onClick} = useClickSyncOpt(receiverIdOf(identity), receiver)
  const {style, className} = colorToProps(color)
  return el("button", {
    style,
    onClick,
    className: clsx(className, INLINE_BUTTON_CLASSNAME, clicked && CLICKED_CLASSNAME)
  }, children)
}


function InlineChip({identity, receiver, color, children}: InlineChipProps) {
  const {clicked, onClick} = useClickSyncOpt(receiverIdOf(identity), receiver)
  const {style, className} = colorToProps(color)
  return el("div", {
    style,
    onClick,
    className: clsx(className, INLINE_CHIP_CLASSNAME, clicked && CLICKED_CLASSNAME)
  }, children)
}


export const inlineComponents = {InlineButton, InlineChip}
