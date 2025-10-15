import { useCallback, useState } from "react";
import { Id, WithId } from "../aligned-bars-api";

function useRegistry<Item extends WithId>() {
    const [registry, setRegistry]  = useState(new Map<Id, Item>());

    const register = useCallback((item: Item) => {
        setRegistry(prev => {
            const next = new Map(prev);
            next.set(item.id, item);
            return next;
        });
    }, []);

    const unregister = useCallback((item: WithId) => {
        setRegistry(prev => {
            const next = new Map(prev);
            next.delete(item.id);
            return next;
        });
    }, []);

    const items = Array.from(registry.values());

    return { register, unregister, items };
}

export { useRegistry }