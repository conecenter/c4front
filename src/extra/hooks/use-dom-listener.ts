import { useCallback, useRef } from "react";

interface DomListenerOptions extends AddEventListenerOptions {
    target?: 'self' | 'document' | 'window';
}

export function useDomListener<T extends Event>(
    type: string,
    handler: (e: T) => void,
    options?: DomListenerOptions | boolean
) {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    const listener = useCallback((e: T) => handlerRef.current(e), []);

    const target = (typeof options === 'object' ? options?.target : undefined) ?? 'self';

    const nodeRef = useRef<EventTarget | null | undefined>(null);

    return useCallback((node: HTMLElement | null) => {
        // detach from previous node
        if (nodeRef.current) {
            nodeRef.current.removeEventListener(type, listener as EventListener, options);
        }

        nodeRef.current = target === 'self' ? node
            : target === 'document' ? node?.ownerDocument
            : node?.ownerDocument.defaultView;

        if (!nodeRef.current) return;

        nodeRef.current.addEventListener(type, listener as EventListener, options);
    }, [target, type, options, listener]);
}
