import React, { ReactNode, createContext, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import NewWindow from 'react-new-window'
import { RootBranchContext } from "../main/vdom-hooks";

const SECOND_WINDOW_NAME = 'second_window';

interface SecondWindowContext {
    secondWindow: boolean,
    toggleSecondWindow?: (on: boolean) => void,
    secondWindowRef?: HTMLDivElement | null
}

const SecondWindowContext = createContext<SecondWindowContext>({ secondWindow: false });
SecondWindowContext.displayName = 'SecondWindowContext';


interface SecondWindowManager {
    children: ReactNode
}

function SecondWindowManager({ children }: SecondWindowManager) {
    const [secondWindow, setSecondWindow] = useState(false);
    const [secondWindowRef, setSecondWindowRef] = useState<HTMLDivElement | null>(null);

    const value = useMemo(() => ({
        secondWindow,
        toggleSecondWindow: setSecondWindow,
        secondWindowRef
    }), [secondWindow, secondWindowRef]);

    return (
        <SecondWindowContext.Provider value={value}>
            {children}
            {secondWindow &&
                <NewWindow name={SECOND_WINDOW_NAME} title={document.title} onUnload={() => setSecondWindow(false)} >
                    <div ref={setSecondWindowRef} className='secondWindowBox' />
                </NewWindow>}
        </SecondWindowContext.Provider>
    );
}


interface SecondWindowComponent {
    children?: ReactNode
}

function SecondWindowComponent({ children }: SecondWindowComponent) {
    const { secondWindowRef } = useContext(SecondWindowContext);
    return secondWindowRef ? createPortal(children, secondWindowRef) : <>{children}</>;
}


function SecondWindowOpener({ children }: SecondWindowComponent) {
    const { secondWindow, toggleSecondWindow } = useContext(SecondWindowContext);
    const { isRoot } = useContext(RootBranchContext);

    const switchToSecondWindow = () => {
        secondWindow ? window.open('', SECOND_WINDOW_NAME) : toggleSecondWindow?.(true);
    }
    const onClick = isRoot ? switchToSecondWindow : undefined;

    return (
        <div tabIndex={-1} onClickCapture={onClick} className='secondWindowOpener' >
            {children}
        </div>
    );
}

export { SecondWindowManager, SecondWindowComponent, SecondWindowOpener }