import React, {ReactNode} from 'react';

interface ChildrenSender {
    key: string,
    children: ReactNode
}

export const ChildrenSender = ({ children }: ChildrenSender) => (
    <>{children}</>
);