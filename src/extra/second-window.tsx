import React, { ReactNode, createContext, useContext, useMemo, useState } from "react";
import NewWindow from 'react-new-window'
import { RootBranchContext } from "../main/vdom-hooks";
import { ButtonElement } from "./button-element";

interface SecondWindowContext {
    secondWindow: boolean,
    toggleSecondWindow?: (on: boolean) => void
}

const SecondWindowContext = createContext<SecondWindowContext>({ secondWindow: false });
SecondWindowContext.displayName = 'SecondWindowContext';


interface SecondWindowManager {
    children: ReactNode
}

function SecondWindowManager({ children }: SecondWindowManager) {
    const [secondWindow, setSecondWindow] = useState(false);
    const { isRoot } = useContext(RootBranchContext);

    const value = useMemo(() => ({
        secondWindow,
        ...isRoot && { toggleSecondWindow: setSecondWindow }
    }), [secondWindow, isRoot]);

    return (
        <SecondWindowContext.Provider value={value} children={children} />
    );
}


interface SecondWindowComponent {
    children: ReactNode
}

function SecondWindowComponent({ children }: SecondWindowComponent) {
    const { secondWindow, toggleSecondWindow } = useContext(SecondWindowContext);

    return secondWindow
        ? <NewWindow onUnload={() => toggleSecondWindow?.(false)}>{children}</NewWindow>
        : <>{children}</>;
}


function SecondWindowButton(props: ButtonElement) {
    const { toggleSecondWindow } = useContext(SecondWindowContext);

    const switchSecondWindow = toggleSecondWindow && (() => toggleSecondWindow(true));
    return <ButtonElement {...props} onClick={switchSecondWindow} />;
}

export { SecondWindowManager, SecondWindowComponent, SecondWindowButton }