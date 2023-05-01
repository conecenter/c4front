import React, { ReactNode, createContext, useRef, useState } from "react";
import { useAddEventListener } from "./custom-hooks";

const PrintContext = createContext(false);
PrintContext.displayName = 'PrintContext';

interface PrintManager {
    key: string,
    children: ReactNode,
    printChildren: ReactNode,
    printMode: boolean
}

function PrintManager({ children, printMode, printChildren }: PrintManager) {
    const windowRef = useRef<Window | null | undefined>(null);
    const [print, setPrint] = useState(false);
    
    useAddEventListener(windowRef.current, 'beforeprint', () => setPrint(true))
    useAddEventListener(windowRef.current, 'afterprint', () => setPrint(false))

    return (
        <>
            {<div ref={elem => windowRef.current = elem?.ownerDocument.defaultView} className='mainContent'>
                {children}
            </div>}
            {print && (
                <div className='printContent'>
                    <PrintContext.Provider value={true} children={printChildren} />
                </div>
            )}
        </>
    );
}

export { PrintManager, PrintContext }