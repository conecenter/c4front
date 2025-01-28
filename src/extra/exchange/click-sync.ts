import {usePatchSync} from "./patch-sync";
import {Identity} from "../utils";

const patchSyncTransformers = {
  serverToState: (b: boolean) => b,
  changeToPatch: () => ({
    headers: {"x-r-action": "click"},
    value: ""
  }),
  patchToChange: () => true,
  applyChange: (prev: boolean, ch: boolean) => ch
}

interface ClickSync {
  clicked: boolean,
  onClick: () => void,
}

function useClickSync(
  identity: Identity,
): ClickSync {
  const {currentState, sendFinalChange} = usePatchSync(identity, false, false, patchSyncTransformers)
  return {
    clicked: currentState,
    onClick: () => sendFinalChange(true)
  }
}

interface ClickSyncOpt {
  clicked: boolean,
  onClick: (() => void) | undefined,
}

function useClickSyncOpt(
  identity: Identity,
  needsReceiver?: boolean
): ClickSyncOpt {
  const {currentState, sendFinalChange} = usePatchSync(identity, false, false, patchSyncTransformers)
  const onClick = needsReceiver ? () => sendFinalChange(true) : undefined
  return {
    clicked: currentState,
    onClick: onClick
  }
}

export {useClickSync, useClickSyncOpt}
export type {ClickSync, ClickSyncOpt}