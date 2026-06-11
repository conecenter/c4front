import React from "react";
import { ScalingElementProps } from "c4f/sapi/ee/cone/c4ui/c4gen.FrontTags";

const ScalingElement = ({ scale, children }: ScalingElementProps) => (
    <div style={{ fontSize: `${scale}em`, display: 'contents' }} >
        {children}
    </div>
);

export { ScalingElement }