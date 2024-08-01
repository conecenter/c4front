import React from "react";
import { BusyMotionElement } from "./busy-motion";
import clsx from "clsx";

const DEFAULT_TEXT = 'Loading, please wait...';

interface LoadingIndicator {
    overlayed?: boolean, // requires 'relative' parent's position
    text?: string
}

const LoadingIndicator = ({ overlayed, text = DEFAULT_TEXT }: LoadingIndicator) => (
    <div className={clsx('loadingIndicator', overlayed ? 'overlayed overlayColorCss' : 'bodyColorCss')}>
        <BusyMotionElement
            fill={overlayed ? 'white' : 'currentColor'}
            stop={false} />
        <pre>{text}</pre>
    </div>
);

export { LoadingIndicator }