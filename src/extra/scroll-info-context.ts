import { createContext } from 'react';

interface ScrollInfo {
    elementsStyles: Map<string, string>,
}

const defaultReducedValue: ScrollInfo = {
    elementsStyles: new Map()
}

const ScrollInfoContext = createContext(defaultReducedValue);

export type { ScrollInfo };
export { ScrollInfoContext };
