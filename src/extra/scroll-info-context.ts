import { createContext } from 'react';

interface ScrollInfo {
    totalSpaceUsed: number,
    compactUiHeader: boolean
}

const defaultReducedValue: ScrollInfo = {
    totalSpaceUsed: 0,
    compactUiHeader: true
}

const ScrollInfoContext = createContext(defaultReducedValue);

export type { ScrollInfo };
export { ScrollInfoContext };
