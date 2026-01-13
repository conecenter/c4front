import { useRef } from "react";
import { useLocalTimeOffset } from "../time-offset-provider";

const THRESHOLD_MS = 60000;

/**
 * @description Force remount FC to update NOW with correct server time (now doesn't update otherwise due to a known bug in <= v.6)
 */
export function useTimeOffsetKey() {
    const { timeOffset } = useLocalTimeOffset();
    const fcOffsetRef = useRef<number | null>(null);

    const prev = fcOffsetRef.current;
    const next = (prev === null || timeOffset === null || Math.abs(prev - timeOffset) > THRESHOLD_MS)
        ? timeOffset : prev;

    fcOffsetRef.current = next;
    return next;
}