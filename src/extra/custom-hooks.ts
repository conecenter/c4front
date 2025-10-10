import { Children, ReactNode, isValidElement, useEffect, useLayoutEffect, useRef } from "react";
import { FlexibleSizes } from "./view-builder/flexible-api";
import { flexibleComponents } from "./view-builder/flexible-elements";

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

function useIsMounted() {
    const isMountedRef = useRef(true);
    useLayoutEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; }
    });
    return isMountedRef;
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

export { useAddEventListener, useLatest, useInterval, useIsMounted, useFlexBasisFromSizes };