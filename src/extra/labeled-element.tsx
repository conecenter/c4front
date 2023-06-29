import React, { useContext, ReactNode, useEffect, useRef, useState, CSSProperties } from 'react';
import clsx from 'clsx';
import { HorizontalCaptionContext, NoCaptionContext } from '../main/vdom-hooks';
import { useClickSyncOpt } from './exchange/click-sync';
import { useFocusControl } from './focus-control';
import { SEL_FOCUSABLE_ATTR } from './focus-module-interface';
import { getUserManualUtils, useUserManual } from './user-manual';
import { FlexibleSizes } from './view-builder/flexible-api';

const NoFocusContext = React.createContext(false);
NoFocusContext.displayName = "NoFocusContext";

interface LabeledElement {
    key: string,
    identity: Object,
    label: string,
    sizes?: FlexibleSizes,
    accented?: boolean,
    clickable?: boolean,
    labelChildren: ReactNode,
    umid?: string,
    children: ReactNode
}

function LabeledElement({ identity, label, sizes, accented, clickable, labelChildren, umid, children }: LabeledElement) {
    const showCaption = !useContext(NoCaptionContext);
    const isHorizontalCaption = useContext(HorizontalCaptionContext);

    const isEmptyLabel = !(label || labelChildren);

    const { focusClass, focusHtml, isFocused } = useFocusControl(isEmptyLabel ? undefined : identity);

    // Disable focusable descendants focus if LE has single childless focusable descendant
    const [disableChildFocus, setDisableChildFocus] = useState(false);
    const refLE = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (isEmptyLabel) setDisableChildFocus(false);
        else setDisableChildFocus(hasSingleChildlessFocusable(refLE.current));
    }, [isEmptyLabel, labelChildren, children]);

    // User manual functionality
    const userManual = useUserManual();
    const umUrl = isFocused && userManual.has(umid) ? userManual.getUrl(umid) : null;
    const {button: umButton, onKeyDown} = getUserManualUtils(umUrl);

    const { clicked, onClick } = useClickSyncOpt(identity, 'receiver', clickable);
    
    const className = clsx(
        'labeledElement',
        focusClass,
        accented && 'accented',
        disableChildFocus && 'focusFrameProvider',
        (!showCaption || isHorizontalCaption) && 'contentBox'
    );

    const style: CSSProperties = {
        flexGrow: sizes?.max ? 1 : undefined,
        ...sizes && {
            minWidth: 'min-content',
            flexBasis: `${sizes.min}em`,
            maxWidth: sizes.max ? `${sizes.max}em` : undefined
        },
        ...clickable && { cursor: 'pointer' },
        ...umUrl && { position: 'relative' }
    };

    return (
        <NoFocusContext.Provider value={disableChildFocus} >
            <div ref={refLE} 
                className={className} 
                {...focusHtml} 
                style={style} 
                onClick={onClick} 
                onKeyDown={onKeyDown} 
                data-umid={umid}
            >
                {showCaption ? (
                    <NoCaptionContext.Provider value={true}>
                        <div className='labelBox' style={clicked ? { opacity: 0.8 } : undefined}>
                            {label && <label>{label}</label>}
                            {labelChildren}
                        </div>
                        <div className='contentBox'>
                            {children}
                        </div>
                    </NoCaptionContext.Provider>)
                    : children }
                {umButton}
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
