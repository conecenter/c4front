import {Patch, PatchHeaders, usePatchSync} from "./patch-sync";
import {Identity} from "../utils";

interface InputSyncState<State> {
  currentState: State,
  setTempState: (s: State) => void,
  setFinalState: (s: State) => void,
}

function useInputSync<ServerState, State>(
  identity: Identity,
  receiverName: string,
  serverState: ServerState,
  deferredSend: boolean,
  patchToState: (p: Patch) => State,
  serverToState: (s: ServerState) => State,
  stateToPatch: (s: State) => Patch
): InputSyncState<State> {
  const {currentState, sendTempChange, sendFinalChange} = usePatchSync<ServerState, State, State>(
    identity,
    receiverName,
    serverState,
    deferredSend,
    serverToState,
    stateToPatch,
    patchToState,
    ((prevState, ch) => ch)
  )
  return {
    currentState,
    setTempState: sendTempChange,
    setFinalState: sendFinalChange
  }
}

export {useInputSync}
export type {InputSyncState, Patch, PatchHeaders}
