import { useEffect, useRef } from "react";

// if element is ref object and changes during component lifecycle, it will not be updated in effect
function useAddEventListener<T extends Event>(
    element: React.RefObject<EventTarget | null> | EventTarget | null | undefined,
    eventName: string,
    handler: (event: T) => void,
    capture: boolean = false
) {
    // Create a ref that stores handler
    const savedHandler = useRef(handler);
    // Update ref.current value if handler changes to always get latest handler without needing to pass it in effect deps array
    savedHandler.current = handler;

    useEffect(() => {
        const targetEl = element && 'current' in element ? element.current : element
        const listener = (e: Event) => savedHandler.current(e as T);
        targetEl?.addEventListener(eventName, listener, capture);
        return () => targetEl?.removeEventListener(eventName, listener, capture);
    }, [eventName, element, capture]);
}

const useLatest = <T>(current: T) => {
    const storedValue = useRef(current);
    useEffect(() => {
        storedValue.current = current;
    });
    return storedValue;
}

function useInterval(callback: () => void, delay: number | null) {
    const savedCallback = useLatest(callback);
    useEffect(() => {
      if (delay !== null) {
        const id = setInterval(() => savedCallback.current(), delay);
        return () => clearInterval(id);
      }
    }, [delay]);
}

export { useAddEventListener, useLatest, useInterval };