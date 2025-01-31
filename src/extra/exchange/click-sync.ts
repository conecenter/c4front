import {usePatchSync} from "./patch-sync";

interface ClickSync {
  clicked: boolean,
  onClick: () => void,
}

function useClickSync(
  identity: object
): ClickSync {
  const {currentState, sendFinalChange} = usePatchSync<boolean, boolean, boolean>(
    identity,
    false,
    false,
    (b) => b,
    (b) => ({
      headers: {"x-r-action": "click"},
      value: ""
    }),
    (p) => true,
    (prevState, ch) => ch
  )
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
  identity: object,
  needsReceiver?: boolean
): ClickSyncOpt {
  const {currentState, sendFinalChange} = usePatchSync<boolean, boolean, boolean>(
    identity,
    false,
    false,
    (b) => b,
    (b) => ({
      headers: {"x-r-action": "click"},
      value: ""
    }),
    (p) => true,
    (prevState, ch) => ch
  )
  const onClick = needsReceiver ? () => sendFinalChange(true) : undefined
  return {
    clicked: currentState,
    onClick: onClick
  }
}

export {useClickSync, useClickSyncOpt}
export type {ClickSync, ClickSyncOpt}
