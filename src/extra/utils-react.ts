export function mergeRefs<T>(...refs: React.Ref<T>[]) {
    return (node: T | null) => {
        for (const ref of refs) {
            if (!ref) continue;
            if (typeof ref === 'function') ref(node);
            else (ref as React.MutableRefObject<T | null>).current = node;
        }
    };
}