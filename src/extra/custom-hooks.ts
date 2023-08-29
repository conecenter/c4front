import { useEffect, useRef } from "react";

function useAddEventListener(
    element: EventTarget | null | undefined,
    eventName: string,
    handler: Function,
    capture: boolean = false,
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
        element?.addEventListener(eventName, listener, capture);
        return () => element?.removeEventListener(eventName, listener, capture);
    }, [eventName, element, ...dependencies]);
}


interface EventHandlersMap {
	[index: string]: EventHandler
}

function useAddMultipleEventListeners(
	element: EventTarget | null | undefined,
	eventHandlers: EventHandlersMap,
	options?: { capture?: boolean }
) {
	const savedHandlers = useRef(eventHandlers);

    useEffect(() => {
		savedHandlers.current = eventHandlers;
	}, [eventHandlers]);

	useEffect(() => {
		if (!element) return;
		const eventNames = Object.keys(savedHandlers.current);
		eventNames.forEach(event => {
			element.addEventListener(event, e => savedHandlers.current[event]?.(e), options?.capture)
		});
		return () => eventNames.forEach(event => {
			element.removeEventListener(event, e => savedHandlers.current[event]?.(e), options?.capture)
		});
	}, [element]);
}

const useLatest = <T extends any>(current: T) => {
    const storedValue = useRef(current);
    useEffect(() => {
        storedValue.current = current;
    });
    return storedValue;
}

export { useAddEventListener, useAddMultipleEventListeners, useLatest };