import React, { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo, useState } from "react";

interface TimeOffsetCtx {
    timeOffset: number | null,
    setTimeOffset: Dispatch<SetStateAction<number | null>>
}

const TimeOffsetContext = createContext<TimeOffsetCtx>({
    timeOffset: null,
    setTimeOffset: () => undefined
});
TimeOffsetContext.displayName = 'TimeOffsetContext';


function TimeOffsetProvider({ children }: { children: ReactNode }) {
    const [timeOffset, setTimeOffset] = useState<number | null>(null);
    const ctxValue = useMemo(() => ({ timeOffset, setTimeOffset }), [timeOffset]);
    return (
        <TimeOffsetContext.Provider value={ctxValue}>
            {children}
        </TimeOffsetContext.Provider>
    );
}

function useLocalTimeOffset() {
    const ctx = useContext(TimeOffsetContext);
    return ctx;
}

export { TimeOffsetProvider, useLocalTimeOffset };