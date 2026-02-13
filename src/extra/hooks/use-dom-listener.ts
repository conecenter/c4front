import { useCallback, useRef } from "react";

export function useDomListener<T extends Event>(
  type: string,
  handler: (e: T) => void,
  options?: AddEventListenerOptions | boolean
) {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    const nodeRef = useRef<EventTarget | null>(null);

    return useCallback((node: EventTarget | null) => {
        // detach from previous node
        if (nodeRef.current) {
            nodeRef.current.removeEventListener(type, listener, options);
        }

        nodeRef.current = node;

        if (!node) return;

        node.addEventListener(type, listener, options);

        function listener(e: Event) {
            handlerRef.current(e as T);
        }
    }, [type, options]);
}