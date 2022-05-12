import clsx from 'clsx';
import React, { useContext, ReactNode } from 'react';
import { NoCaptionContext } from '../main/vdom-hooks';
import { useFocusControl, FocusControlObj } from './focus-control';

interface LabeledInput {
    key: string,
    path: string,
    children: ReactNode // LabelElement & InputElement
}

function LabeledInput({ path, children }: LabeledInput) {
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
    labelChildren: ReactNode,
    children: ReactNode
}

function LabeledElement({ path, label, labelChildren, children }: LabeledElement) {
    const showCaption = !useContext(NoCaptionContext);

    const { focusClass, focusHtml }: FocusControlObj = showCaption? useFocusControl(path) : {};

    const className = clsx('labeledElement', focusClass);

    return (
        <div className={className} {...focusHtml} >
            {showCaption && 
                <div className='labelBox'>
                    <label>{label}</label>
                    {labelChildren}
                </div>}
            <div className='contentBox'>
                {children}
            </div>
        </div>
    );
}

export { LabeledElement, LabeledInput }
