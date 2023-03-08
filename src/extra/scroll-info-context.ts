import { createContext } from 'react';

interface ScrollInfo {
    elementsStyles: Map<string, string>,
    totalSpaceUsed: number
}

const defaultReducedValue: ScrollInfo = {
    elementsStyles: new Map(),
    totalSpaceUsed: 0
}

const ScrollInfoContext = createContext(defaultReducedValue);

export type { ScrollInfo };
export { ScrollInfoContext };
