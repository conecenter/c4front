import { Children, ReactNode, isValidElement, useEffect, useRef } from "react";
import { FlexibleSizes } from "./view-builder/flexible-api";
import { flexibleComponents } from "./view-builder/flexible-elements";

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

// element width shouldn't depend on content if not explicitly sized from server
const useFlexBasisFromSizes = (children: ReactNode, sizes?: FlexibleSizes) => {
    const flexBasis = sizes?.min || calcChildrenSize(children);
    return { flexBasis: `${flexBasis}em` };
}

// TODO: add logic for calc min-width for lists
function calcChildrenSize(children: ReactNode): number {
    const childrenArray = Children.toArray(children);
    return childrenArray.reduce<number>((accum, child) => {
        if (!isValidElement(child)) return accum;
        const { sizes }: { sizes?: FlexibleSizes } = child.props;
        if (sizes) return Math.max(sizes.min, accum);
        if (child.type === flexibleComponents.FlexibleRow) {
            const rowChildrenArray = Children.toArray(child.props.children);
            return Math.max(rowChildrenArray.reduce<number>((accum, rowChild) => accum + calcChildrenSize(rowChild), 0), accum);
        }
        return Math.max(calcChildrenSize(child.props.children), accum);
    }, 0);
}

export { useAddEventListener, useLatest, useInterval, useFlexBasisFromSizes };