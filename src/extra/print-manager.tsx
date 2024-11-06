import React, { ReactNode, createContext, useEffect, useRef, useState } from "react";
import { useAddEventListener } from "./custom-hooks";
import { usePatchSync } from "./exchange/patch-sync";

const PrintContext = createContext(false);
PrintContext.displayName = 'PrintContext';

interface PrintManager {
    key: string,
    identity: Object,
    children: ReactNode,
    printChildren: ReactNode,
    printMode: boolean,
    printTitle?: string
}

const changeToPatch = () => ({
    headers: {"x-r-printmode": "0"},
    value: ""
});

function PrintManager({ identity, children, printMode: state, printChildren, printTitle }: PrintManager) {
    const [elem, setElem] = useState<HTMLDivElement | null>(null);
    const window = elem?.ownerDocument.defaultView;

    const [isPrinting, setIsPrinting] = useState(false);

    const {currentState: printMode, sendFinalChange} =
        usePatchSync(identity, 'receiver', state, false, (b) => b, changeToPatch, (p) => false, (prev, ch) => prev);

    // Custom print from server
    useEffect(() => {
        if (printMode) setTimeout(() => window?.print());
    }, [printMode]);

    const pageTitle = useRef(document.title);

    // Make changes for print
    const onBeforePrint = () => {
        if (printTitle) {
            pageTitle.current = document.title;
            document.title = printTitle;
        }
        setIsPrinting(true);
    }
    const onAfterPrint = () => {
        document.title = pageTitle.current;
        setIsPrinting(false);
        printMode && sendFinalChange(false);
    }
    useAddEventListener(window, 'beforeprint', onBeforePrint);
    useAddEventListener(window, 'afterprint', onAfterPrint);

    return (
        <>
            <div ref={setElem} className='mainContent'>{children}</div>
            {isPrinting && (
                <div className='printContent'>
                    <PrintContext.Provider value={true} children={printMode ? printChildren : children} />
                </div>
            )}
        </>
    );
}

export { PrintManager, PrintContext }