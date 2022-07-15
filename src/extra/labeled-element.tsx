import clsx from 'clsx';
import React, { useContext, ReactNode, useEffect, useRef, useState } from 'react';
import { HorizontalCaptionContext, NoCaptionContext } from '../main/vdom-hooks';
import { useFocusControl, FocusControlObj } from './focus-control';
import { SEL_FOCUSABLE } from './focus-module-interface';
import { FlexibleSizes } from './view-builder/flexible-api';


const NoFocusContext = React.createContext(false);


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

    const { focusClass, focusHtml }: FocusControlObj = useFocusControl(path);

    const isHorizontalCaption = useContext(HorizontalCaptionContext);

    // Disable focusable descendants focus if LE has single childless focusable descendant
    const [disableChildFocus, setDisableChildFocus] = useState(false);
    const refLE = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (hasSingleChildlessFocusable(refLE.current)) {
            setDisableChildFocus(true);
        }
    }, []);

    const className = clsx(
        'labeledElement', 
        focusClass,
        isHorizontalCaption && 'horizontalCaption'
    );

    const style = {
        flexGrow: sizes?.max ? 1 : undefined,
        ...sizes && {
            flexBasis: `${sizes.min}em`,
            maxWidth: sizes.max ? `${sizes.max}em` : undefined
        }
    };
    
    return (
        <NoFocusContext.Provider value={disableChildFocus} >
            <div ref={refLE} className={className} {...focusHtml} style={style} >
                {showCaption ? (
                    <NoCaptionContext.Provider value={true}>
                        <div className='labelBox'>
                            <label>{label}</label>
                            {labelChildren}
                        </div>
                        <div className='contentBox'>
                            {children}
                        </div>
                    </NoCaptionContext.Provider>
                ) 
                : children}
            </div>
        </NoFocusContext.Provider>
    );
}

function hasSingleChildlessFocusable(elem: HTMLDivElement | null) {
    const focusableDescendants = elem?.querySelectorAll(SEL_FOCUSABLE);
    if (!focusableDescendants) return false;
    if (focusableDescendants.length <= 1) return true;

    let count = 0;
    for (let elem of focusableDescendants) {
        const focusableInside = elem.querySelector(SEL_FOCUSABLE);
        if (!focusableInside) {
            count++;
            if (count > 1) break;
        }
    }
    return count <= 1;
}

export { LabeledElement, NoFocusContext };
