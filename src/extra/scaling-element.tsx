import React from "react";
import { ScalingElementProps } from "types/c4gen.FrontTags";

const ScalingElement = ({ scale, children }: ScalingElementProps) => (
    <div style={{ fontSize: `${scale}em`, display: 'contents' }} >
        {children}
    </div>
);

export { ScalingElement }