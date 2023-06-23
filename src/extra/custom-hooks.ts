import { useEffect, useRef } from "react";

const useLatest = <T extends any>(current: T) => {
    const storedValue = useRef(current);
    useEffect(() => {
        storedValue.current = current;
    });
    return storedValue;
}

export {useLatest}