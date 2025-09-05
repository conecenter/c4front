import { useEffect, useRef } from "react"
import { unstable_batchedUpdates } from "react-dom"
import useResizeObserver from "@react-hook/resize-observer"

const scheduled = new Set<() => void>();
let rafId: ReturnType<typeof requestAnimationFrame> | null = null;

function schedule(fn: () => void) {
    scheduled.add(fn);

    if (!rafId) {
        rafId = requestAnimationFrame(() => { 
            rafId = null;
            const tasks = Array.from(scheduled);
            scheduled.clear();

            unstable_batchedUpdates(() => {
                for (const run of tasks) run();
            });
        });
    }
}

function useBatchedResizeObserver<T extends HTMLElement>(
	ref: React.MutableRefObject<T> | null,
	callback: (entry: ResizeObserverEntry) => void
) {
	const mountedRef = useRef(true);

	useEffect(
		function trackMount() {
			mountedRef.current = true
			return () => { mountedRef.current = false }
		},
		[]
	);

	useResizeObserver(ref, entry => {
		schedule(() => {
			if (mountedRef.current) callback(entry);
		});
	})
}

export { useBatchedResizeObserver }