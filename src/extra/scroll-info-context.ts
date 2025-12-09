import { createContext } from 'react';

interface ScrollInfo {
    totalSpaceUsed: number,
    compactUiHeader: boolean,
    setScrollLock: (on: boolean) => void
}

const defaultReducedValue: ScrollInfo = {
    totalSpaceUsed: 0,
    compactUiHeader: true,
    setScrollLock: () => {}
}

const ScrollInfoContext = createContext(defaultReducedValue);

export type { ScrollInfo };
export { ScrollInfoContext };
