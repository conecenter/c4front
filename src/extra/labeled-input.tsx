import clsx from 'clsx';
import React, { ReactNode } from 'react';
import { useFocusControl } from './focus-control';

interface LabeledInput {
    key: string,
    path: string,
    children: ReactNode // LabelElement & InputElement
}

export function LabeledInput({ path, children }: LabeledInput) {
    const focusClassName = useFocusControl(path);
    const className = clsx('labeledInputBox', focusClassName);
    return (
        <div className={className} data-path={path} tabIndex={1}>
            {children}
        </div>
    );
}