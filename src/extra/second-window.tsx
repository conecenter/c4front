import React, { ReactNode, createContext, useContext, useMemo, useState } from "react";
import NewWindow from 'react-new-window'
import { RootBranchContext } from "../main/vdom-hooks";
import { ButtonElement } from "./button-element";

const SECOND_WINDOW_NAME = 'second_window';

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

    const value = useMemo(() => ({ secondWindow, toggleSecondWindow: setSecondWindow }), [secondWindow]);

    return <SecondWindowContext.Provider value={value} children={children} />;
}


interface SecondWindowComponent {
    children: ReactNode
}

function SecondWindowComponent({ children }: SecondWindowComponent) {
    const { secondWindow, toggleSecondWindow } = useContext(SecondWindowContext);

    return secondWindow
        ? <NewWindow name={SECOND_WINDOW_NAME} onUnload={() => toggleSecondWindow?.(false)} children={children} />
        : <>{children}</>;
}


function SecondWindowButton(props: ButtonElement) {
    const { secondWindow, toggleSecondWindow } = useContext(SecondWindowContext);
    const { isRoot } = useContext(RootBranchContext);

    const switchToSecondWindow = () => {
        secondWindow ? window.open('', SECOND_WINDOW_NAME) : toggleSecondWindow?.(true);
    }
    const onClick = isRoot ? switchToSecondWindow : undefined;

    return <ButtonElement {...props} onClick={onClick} />;
}

export { SecondWindowManager, SecondWindowComponent, SecondWindowButton }