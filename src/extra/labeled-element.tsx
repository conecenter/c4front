import clsx from 'clsx';
import React, { useContext, ReactNode, useEffect, useRef, useState } from 'react';
import { HorizontalCaptionContext, NoCaptionContext } from '../main/vdom-hooks';
import { useClickSyncOpt } from './exchange/click-sync';
import { useFocusControl } from './focus-control';
import { SEL_FOCUSABLE_ATTR } from './focus-module-interface';
import { FlexibleSizes } from './view-builder/flexible-api';


const NoFocusContext = React.createContext(false);


interface LabeledElement {
    key: string,
    identity: Object,
    path: string,
    label: string,
    sizes?: FlexibleSizes,
    accented?: boolean,
    clickable?: boolean,
    labelChildren: ReactNode,
    children: ReactNode
}

function LabeledElement({ identity, path, label, sizes, accented, clickable, labelChildren, children }: LabeledElement) {
    const showCaption = !useContext(NoCaptionContext);
    const isHorizontalCaption = useContext(HorizontalCaptionContext);

    const { focusClass, focusHtml } = useFocusControl(path);

    // Disable focusable descendants focus if LE has single childless focusable descendant
    const [disableChildFocus, setDisableChildFocus] = useState(false);
    const refLE = useRef<HTMLDivElement>(null);
    useEffect(() => {
        setDisableChildFocus(hasSingleChildlessFocusable(refLE.current));
    }, [labelChildren, children]);

    const { clicked, onClick } = useClickSyncOpt(identity, 'receiver', clickable);
    
    const className = clsx(
        'labeledElement',
        focusClass,
        accented && 'accented',
        disableChildFocus && 'focusFrameProvider',
        (!showCaption || isHorizontalCaption) && 'contentBox'
    );

    const style = {
        flexGrow: sizes?.max ? 1 : undefined,
        ...sizes && {
            flexBasis: `${sizes.min}em`,
            maxWidth: sizes.max ? `${sizes.max}em` : undefined
        },
        ...clickable && { cursor: 'pointer' }
    };

    return (
        <NoFocusContext.Provider value={disableChildFocus} >
                <div ref={refLE} className={className} {...focusHtml} style={style} onClick={onClick} >
                    {showCaption ? (
                        <NoCaptionContext.Provider value={true} >
                            <div className='labelBox' style={clicked ? { opacity: 0.8 } : undefined}>
                                {label && <label>{label}</label>}
                                {labelChildren}
                            </div>
                            <div className='contentBox'>
                                {children}
                            </div>
                        </NoCaptionContext.Provider> )
                        : children }
                </div>
        </NoFocusContext.Provider>
    );
}

function hasSingleChildlessFocusable(elem: HTMLDivElement | null) {
    const focusableDescendants = elem?.querySelectorAll(SEL_FOCUSABLE_ATTR);
    if (!focusableDescendants) return false;
    if (focusableDescendants.length === 1) return true;

    let count = 0;
    for (let elem of focusableDescendants) {
        const focusableInside = elem.querySelector(SEL_FOCUSABLE_ATTR);
        if (!focusableInside) {
            count++;
            if (count > 1) break;
        }
    }
    return count === 1;
}

export { LabeledElement, NoFocusContext };
