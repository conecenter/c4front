import { useEffect, useRef } from "react";

function useAddEventListener<T extends Event>(
    element: EventTarget | null | undefined,
    eventName: string,
    handler: (event: T) => void,
    capture: boolean = false,
    dependencies: unknown[] = []
) {
    // Create a ref that stores handler
    const savedHandler = useRef(handler);

    // Update ref.current value if handler changes to always get latest handler without needing to pass it in effect deps array
    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const listener = (e: Event) => savedHandler.current(e as T);
        element?.addEventListener(eventName, listener, capture);
        return () => element?.removeEventListener(eventName, listener, capture);
    }, [eventName, element, ...dependencies]);
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