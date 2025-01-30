import React, { ReactNode, createContext, useEffect, useRef, useState } from "react";
import { useAddEventListener } from "./custom-hooks";
import { usePatchSync } from "./exchange/patch-sync";

const PrintContext = createContext(false);
PrintContext.displayName = 'PrintContext';

interface PrintManager {
    key: string,
    identity: object,
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

    const pageTitle = useRef(document.title);
    function setTitleForPrint(title?: string) {
        if (title) {
            pageTitle.current = document.title;
            document.title = title;
        }
    }

    useEffect(function customPrintFromServer() {
        if (printMode) setTimeout(() => {
            setTitleForPrint(printTitle);
            window?.print();
        });
    }, [printMode]);

    // Make changes for print
    const onBeforePrint = () => setIsPrinting(true);
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
                    <PrintContext.Provider value={true}>
                        {printMode ? printChildren : children}
                    </PrintContext.Provider>
                </div>
            )}
        </>
    );
}

export { PrintManager, PrintContext }