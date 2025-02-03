import { createElement as $, ReactNode, createContext, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { usePatchSync, Patch, PatchSyncTransformers } from "./exchange/patch-sync";
import { useAddEventListener } from "./custom-hooks";
import { RootBranchContext } from '../main/vdom-hooks';
import { identityAt } from '../main/vdom-util';

const DEFAULT_UI_TYPE = 'pointer';

type UiType = 'pointer' | 'touch';

const UiInfoContext = createContext<UiType>(DEFAULT_UI_TYPE);
UiInfoContext.displayName = 'UiInfoContext';


interface VkInfoContext {
    haveVk: boolean,
    setHaveVk?: React.Dispatch<React.SetStateAction<boolean>>
}

const VkInfoContext = createContext<VkInfoContext>({ haveVk: false });
VkInfoContext.displayName = 'VkInfoContext';


// Server exchange
const receiverIdOf = identityAt('receiver');

const changeToPatch = (ch: UiType) => ({
    headers: { "x-r-ui-type": ch },
    value: ""
});

const patchToChange = (patch: Patch) => patch.headers!["x-r-ui-type"] as UiType;

const patchSyncTransformers: PatchSyncTransformers<UiType | undefined, UiType | undefined, UiType> = {
    serverToState: (s) => s,
    changeToPatch,
    patchToChange,
    applyChange: (_, ch) => ch
};
//

interface UiInfoProvider {
    key: string,
    identity: object,
    uiType?: UiType,
    children: ReactNode
}

function UiInfoProvider({identity, uiType: state, children}: UiInfoProvider) {
    // UiType functionality
    const {currentState: uiType, sendFinalChange} =
        usePatchSync(receiverIdOf(identity), state, false, patchSyncTransformers);

    const { isRoot } = useContext(RootBranchContext);

    const pointerMql = useRef(window.matchMedia("(any-hover: hover) and (any-pointer: fine)"));

    const updateUiType = () => {
        if (!isRoot) return;
        const currentUiType: UiType = pointerMql.current.matches ? 'pointer' : 'touch';
        if (uiType !== currentUiType) sendFinalChange(currentUiType);
    }

    useLayoutEffect(() => updateUiType(), []);

    useAddEventListener(pointerMql.current, 'change', updateUiType);

    // VK context functionality
    const [haveVk, setHaveVk] = useState(false);
    const vkInfo = useMemo(() => ({ haveVk, setHaveVk }), [haveVk]);

    return $(UiInfoContext.Provider, {value: uiType || DEFAULT_UI_TYPE}, 
        $(VkInfoContext.Provider, {value: vkInfo}, children));
}

export { UiInfoContext, VkInfoContext, UiInfoProvider }