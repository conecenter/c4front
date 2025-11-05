import React, { ReactNode, createContext, useEffect, useRef, useState } from "react";
import { useAddEventListener } from "./custom-hooks";
import { PatchSyncTransformers, usePatchSync } from "./exchange/patch-sync";
import { identityAt } from "../main/vdom-util";
import { Identity } from "./utils";

const PrintContext = createContext(false);
PrintContext.displayName = 'PrintContext';

const receiverIdOf = identityAt('receiver');

const patchSyncTransformers: PatchSyncTransformers<boolean, boolean, boolean> = {
    serverToState: (s: boolean) => s,
    changeToPatch: () => ({
        headers: {"x-r-printmode": "0"},
        value: ""
    }),
    patchToChange: (_p) => false,
    applyChange: (_prev, ch) => ch
};

interface PrintManager {
    key: string,
    identity: Identity,
    children: ReactNode,
    printChildren: ReactNode,
    printMode: boolean,
    printTitle?: string
}

function PrintManager({ identity, children, printMode: state, printChildren, printTitle }: PrintManager) {
    const [elem, setElem] = useState<HTMLDivElement | null>(null);
    const window = elem?.ownerDocument.defaultView;

    const {currentState: printMode, sendFinalChange} =
        usePatchSync(receiverIdOf(identity), state, false, patchSyncTransformers);

    usePrintTitle(printMode, printTitle);

    useEffect(function customPrintFromServer() {
        if (printMode) requestAnimationFrame(() => window?.print());
    }, [printMode]);

    // Make changes for print
    const onAfterPrint = () => printMode && sendFinalChange(false);
    useAddEventListener(window, 'afterprint', onAfterPrint);

    return (
        <>
            <div ref={setElem} className='mainContent'>{children}</div>
            {printMode && (
                <div className='printContent'>
                    <PrintContext.Provider value={true}>
                        {printChildren || children}
                    </PrintContext.Provider>
                </div>
            )}
        </>
    );
}

function usePrintTitle(printMode: boolean, title?: string) {
    const pageTitle = useRef(document.title);
    function setTitleForPrint(title?: string) {
        if (title) {
            pageTitle.current = document.title;
            document.title = title;
        }
    }
    useEffect(() => {
        if (printMode) setTitleForPrint(title);
        else document.title = pageTitle.current;
    }, [printMode]);
}

export { PrintManager, PrintContext }