import React, { ReactNode, createContext, useEffect, useState } from "react";
import { useAddEventListener } from "./custom-hooks";
import { usePatchSync } from "./exchange/patch-sync";

const PrintContext = createContext(false);
PrintContext.displayName = 'PrintContext';

interface PrintManager {
    key: string,
    identity: Object,
    children: ReactNode,
    printChildren: ReactNode,
    printMode: boolean
}

const changeToPatch = () => ({
    headers: {"x-r-printMode": "0"},
    value: ""
});

function PrintManager({ identity, children, printMode: state, printChildren }: PrintManager) {
    const [elem, setElem] = useState<HTMLDivElement | null>(null);
    const window = elem?.ownerDocument.defaultView;

    const [isPrinting, setIsPrinting] = useState(false);

    const {currentState: printMode, sendFinalChange} =
        usePatchSync(identity, 'receiver', state, false, (b) => b, changeToPatch, (p) => false, (prev, ch) => ch);

    // Custom print from server
    useEffect(() => {
        if (printMode) window?.print();
    }, [printMode]);

    // Make changes for print
    useAddEventListener(window, 'beforeprint', () => setIsPrinting(true));
    useAddEventListener(window, 'afterprint', onAfterPrint);

    function onAfterPrint() {
        setIsPrinting(false);
        printMode && sendFinalChange(false);
    };

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