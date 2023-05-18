import React, { ReactNode, createContext, useContext, useLayoutEffect, useRef } from 'react';
import { usePatchSync, Patch } from "./exchange/patch-sync";
import { useAddEventListener } from "./custom-hooks";
import { RootBranchContext } from '../main/vdom-hooks';

const DEFAULT_UI_TYPE = 'pointer';

type UiType = 'pointer' | 'touch';

const UiInfoContext = createContext<UiType>(DEFAULT_UI_TYPE);
UiInfoContext.displayName = 'UiInfoContext';

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
    const {currentState: uiType, sendFinalChange} =
        usePatchSync(identity, 'receiver', state, false, (b) => b, changeToPatch, patchToChange, (prev, ch) => ch);

    const isRootBranch = useContext(RootBranchContext);

    const pointerMql = useRef(window.matchMedia("(any-hover: hover) and (any-pointer: fine)"));

    const updateUiType = () => {
        const currentUiType: UiType = pointerMql.current.matches ? 'pointer' : 'touch';
        if (isRootBranch && uiType !== currentUiType) sendFinalChange(currentUiType);
    }

    useLayoutEffect(() => { !uiType && updateUiType() }, []);

    useAddEventListener(pointerMql.current, 'change', updateUiType);

    return <UiInfoContext.Provider value={uiType || DEFAULT_UI_TYPE} children={children} />
}

export { UiInfoContext, UiInfoProvider }