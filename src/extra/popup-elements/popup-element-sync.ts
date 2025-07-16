import { identityAt } from "../../main/vdom-util";
import { usePatchSync } from "../exchange/patch-sync";

const FALLBACK_IDENTITY = { key: 'fallback_identity' };

const closeActionIdOf = identityAt('closeReceiver');

const patchSyncTransformers = {
    serverToState: (b: boolean) => b,
    changeToPatch: () => ({
        headers: {"x-r-action": "close"},
        value: ""
    }),
    patchToChange: () => true,
    applyChange: (_prev: boolean, ch: boolean) => ch
}

function useCloseSync(
    identity?: object,
    needsReceiver?: boolean
) {
    const { currentState: isClosing, sendTempChange, wasChanged } =
        usePatchSync(closeActionIdOf(identity || FALLBACK_IDENTITY), false, false, patchSyncTransformers);

    const sendClose = identity && needsReceiver ? () => sendTempChange(true) : undefined;

    const isModal = wasChanged && !isClosing;

    return { isModal, sendClose };
}

export { useCloseSync };