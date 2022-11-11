import { useEffect, useRef } from "react";

function useAddEventListener(
    element: EventTarget | null | undefined,
    eventName: string,
    handler: Function,
    dependencies: any[] = []
) {
    // Create a ref that stores handler
    const savedHandler = useRef(handler);

    // Update ref.current value if handler changes to always get latest handler without needing to pass it in effect deps array
    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const listener = (e: Event) => savedHandler.current(e);
        element?.addEventListener(eventName, listener);
        return () => element?.removeEventListener(eventName, listener);
    }, [eventName, element, ...dependencies]);
}

export { useAddEventListener };