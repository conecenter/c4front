import React, { ReactNode } from "react";

interface ScalingElement {
    scale: number,
    children?: ReactNode
}

const ScalingElement = ({ scale, children }: ScalingElement) => (
    <div style={{ fontSize: `${scale}em`, display: 'contents' }} >
        {children}
    </div>
);

export { ScalingElement }