import React, { useContext, ReactNode, useEffect, useRef, useState, CSSProperties } from 'react';
import clsx from 'clsx';
import { HorizontalCaptionContext, NoCaptionContext } from '../main/vdom-hooks';
import { useFocusControl } from './focus-control';
import { FlexibleSizes } from './view-builder/flexible-api';
import { SEL_FOCUS_FRAME } from './css-selectors';
import { ContextActionsElement } from './context-actions-element';

interface LabeledElement {
    identity?: object,
    path?: string,
    label?: string,
    sizes?: FlexibleSizes,
    accented?: boolean,
    clickable?: boolean,
    labelChildren?: ReactNode,
    umid?: string,
    hint?: string,
    className?: string, // front only
    goToChip?: ReactNode,
    children: ReactNode
}

function LabeledElement({ path, label, sizes, accented, clickable, labelChildren, umid, goToChip, children, ...props }: LabeledElement) {
    const showCaption = !useContext(NoCaptionContext);
    const isHorizontalCaption = useContext(HorizontalCaptionContext);

    const isEmptyLabel = !(label || labelChildren);

    const { focusClass, focusHtml } = useFocusControl(isEmptyLabel ? '' : path);

    // Disable focusable descendants focus if LE has single childless focusable descendant
    const [disableChildFocus, setDisableChildFocus] = useState(false);
    const refLE = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (isEmptyLabel) setDisableChildFocus(false);
        else setDisableChildFocus(hasSingleChildlessFocusable(refLE.current));
    }, [isEmptyLabel, labelChildren, children]);

    // const { clicked, onClick } = useClickSyncOpt(identity, 'receiver', clickable);

    const className = clsx(
        'labeledElement',
        focusClass,
        accented && 'accented',
        disableChildFocus && 'focusFrameProvider',
        (!showCaption || isHorizontalCaption) && 'contentBox',
        props.className
    );

    const style: CSSProperties = {
        flexGrow: sizes?.max ? 1 : undefined,
        ...sizes && {
            minWidth: 'min-content',
            flexBasis: `${sizes.min}em`,
            maxWidth: sizes.max ? `${sizes.max}em` : undefined
        },
        ...clickable && { cursor: 'pointer' }
    };

    return (
        <div ref={refLE}
            className={className}
            {...focusHtml}
            style={style}
            data-umid={umid}
            title={props.hint}
        >
            {showCaption ? (
                <NoCaptionContext.Provider value={true}>
                    <div className='labelBox' /*style={clicked ? { opacity: 0.8 } : undefined}*/>
                        {label && <label>{label}</label>}
                        {labelChildren}
                    </div>
                    <div className='contentBox'>{children}</div>
                </NoCaptionContext.Provider>)
                : children }

                {(umid || goToChip) &&
                    <ContextActionsElement umid={umid} goToChip={goToChip} refLE={refLE} />}
        </div>
    );
}

function hasSingleChildlessFocusable(elem: HTMLDivElement | null) {
    const focusableDescendants = elem?.querySelectorAll(SEL_FOCUS_FRAME);
    if (!focusableDescendants) return false;
    if (focusableDescendants.length === 1) return true;

    let count = 0;
    for (const elem of focusableDescendants) {
        const focusableInside = elem.querySelector(SEL_FOCUS_FRAME);
        if (!focusableInside) {
            count++;
            if (count > 1) break;
        }
    }
    return count === 1;
}

export { LabeledElement };