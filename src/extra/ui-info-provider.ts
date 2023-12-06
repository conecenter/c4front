import { createElement as $, ReactNode, createContext, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { usePatchSync, Patch } from "./exchange/patch-sync";
import { useAddEventListener } from "./custom-hooks";
import { RootBranchContext } from '../main/vdom-hooks';

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
const changeToPatch = (ch: UiType) => ({
    headers: { "x-r-ui-type": ch },
    value: ""
});

const patchToChange = (patch: Patch) => patch.headers!["x-r-ui-type"] as UiType;
//

interface UiInfoProvider {
    key: string,
    identity: Object,
    uiType?: UiType,
    children: ReactNode
}

function UiInfoProvider({identity, uiType: state, children}: UiInfoProvider) {
    // UiType functionality
    const {currentState: uiType, sendFinalChange} =
        usePatchSync(identity, 'receiver', state, false, (b) => b, changeToPatch, patchToChange, (prev, ch) => ch);

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