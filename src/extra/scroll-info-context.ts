import { createContext } from 'react';

interface ScrollInfo {
    elementsStyles: Map<string, string>,
    totalSpaceUsed: number,
    compactUiHeader: boolean
}

const defaultReducedValue: ScrollInfo = {
    elementsStyles: new Map(),
    totalSpaceUsed: 0,
    compactUiHeader: true
}

const ScrollInfoContext = createContext(defaultReducedValue);

export type { ScrollInfo };
export { ScrollInfoContext };
