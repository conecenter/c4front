import clsx from 'clsx';
import React, { ReactNode } from 'react';
import { useFocusControl } from './focus-control';

interface LabeledInput {
    key: string,
    path: string,
    children: ReactNode // LabelElement & InputElement
}

export function LabeledInput({ path, children }: LabeledInput) {
    const { focusClass, focusHtml } = useFocusControl(path);
    const className = clsx('labeledInputBox', focusClass);
    return (
        <div className={className} {...focusHtml} >
            {children}
        </div>
    );
}

interface LabeledElement {
    key: string,
    path: string,
    label: string,
    content: ReactNode
}

// export function LabeledElement({ path, content }: LabeledElement) {
//     // const focusClassName = useFocusControl(path);
//     // const className = clsx('labeledInputBox', focusClassName);
//     return (
//         <div className={className} data-path={path} tabIndex={path ? 1 : undefined}>
//             {content}
//         </div>
//     );
// }