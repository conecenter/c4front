import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * @unsafe Prefer `useDomListener` instead.
 * If element is a ref, changes to ref.current won't re-trigger the effect.
 * Do not pass ref.current directly.
 * Unsafe if ref setting is delayed by conditional render or wrapper like Tooltip.
 */
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

/**
 * Returns the value from the previous render.
 * On first render returns `undefined`.
 */
export function usePrevious<T>(value: T): T | undefined;
export function usePrevious<T>(value: T, initial: T): T;
export function usePrevious<T>(value: T, initial?: T) {
    const ref = useRef<T | undefined>(initial);
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
}

export function useChange<T>(
    value: T,
    onChange: (current: T, prev: T) => void
) {
    const storedOnChange = useLatest(onChange);
    const prevValue = usePrevious(value, value);
    useEffect(() => {
        if (value !== prevValue) storedOnChange.current(value, prevValue)
    }, [value, prevValue, storedOnChange]);
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

function useIsMounted() {
    const isMountedRef = useRef(true);
    useLayoutEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; }
    });
    return isMountedRef;
}

export { useAddEventListener, useLatest, useInterval, useIsMounted };