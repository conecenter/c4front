import React from "react";
import { BusyMotionElement } from "./busy-motion";
import clsx from "clsx";

interface LoadingIndicator {
    overlayed?: boolean // requires 'relative' parent's position
}

const LoadingIndicator = ({ overlayed }: LoadingIndicator) => (
    <div className={clsx('loadingIndicator', overlayed ? 'overlayed overlayColorCss' : 'bodyColorCss')}>
        <BusyMotionElement
            fill={overlayed ? 'white' : 'currentColor'}
            stop={false} />
        <pre>Loading, please wait...</pre>
    </div>
);

export { LoadingIndicator }