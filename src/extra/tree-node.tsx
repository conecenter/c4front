import React, { ReactNode } from 'react';

interface TreeNode {
    level: number,
    children: ReactNode
}

const TreeNode = ({level, children}: TreeNode) => (
    <div style={{ paddingLeft: `${level}em`}}>
        {children}
    </div>
);

export { TreeNode }