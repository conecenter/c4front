import clsx from 'clsx';
import React, { useContext, ReactNode } from 'react';
import { HorizontalCaptionContext, NoCaptionContext } from '../main/vdom-hooks';
import { useFocusControl, FocusControlObj } from './focus-control';
import { FlexibleSizes } from './view-builder/flexible-api';


interface LabeledElement {
    key: string,
    path: string,
    label: string,
    sizes?: FlexibleSizes,
    labelChildren: ReactNode,
    children: ReactNode
}

function LabeledElement({ path, label, sizes, labelChildren, children }: LabeledElement) {
    const showCaption = !useContext(NoCaptionContext);
    const { focusClass, focusHtml }: FocusControlObj = showCaption? useFocusControl(path) : {};

    const isHorizontalCaption = useContext(HorizontalCaptionContext);

    const className = clsx('labeledElement', focusClass, isHorizontalCaption && 'horizontalCaption');

    const style = {
        flexGrow: sizes?.max ? 1 : undefined,
        ...sizes && {
          flexBasis: `${sizes.min}em`,
          maxWidth: sizes.max ? `${sizes.max}em` : undefined
        }
    };
    
    return (
        <div className={className} {...focusHtml} style={style} >
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

export { LabeledElement }
