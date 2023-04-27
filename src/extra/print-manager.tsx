import React, { ReactNode } from "react";

interface PrintManager {
    key: string,
    children: ReactNode,
    printChildren?: ReactNode,
    printMode: boolean
 }

function PrintManager({ children, printChildren, printMode }: PrintManager) {
    return children;
}

export { PrintManager }