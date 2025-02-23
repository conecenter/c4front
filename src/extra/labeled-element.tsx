import React, { useContext, ReactNode, useEffect, useRef, useState, CSSProperties } from 'react';
import clsx from 'clsx';
import { HorizontalCaptionContext, NoCaptionContext } from '../main/vdom-hooks';
import { useFocusControl } from './focus-control';
import { useUserManual } from './user-manual';
import { FlexibleSizes } from './view-builder/flexible-api';
import { SEL_FOCUSABLE_ATTR } from './css-selectors';
import { ChipElement } from './chip/chip';

const NoFocusContext = React.createContext(false);
NoFocusContext.displayName = "NoFocusContext";

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
    transitionUrl?: string,
    children: ReactNode
}

function LabeledElement({ path, label, sizes, accented, clickable, labelChildren, umid, transitionUrl, children, ...props }: LabeledElement) {
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

    // User manual functionality
    const { button: umButton, onKeyDown } = useUserManual(umid);

    const transitionChip = !!transitionUrl && getTransitionChip(transitionUrl);

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
        <NoFocusContext.Provider value={disableChildFocus} >
            <div ref={refLE}
                className={className}
                {...focusHtml}
                style={style}
                onKeyDown={onKeyDown}
                data-umid={umid}
                title={props.hint}
            >
                {showCaption ? (
                    <NoCaptionContext.Provider value={true}>
                        <div className='labelBox' /*style={clicked ? { opacity: 0.8 } : undefined}*/>
                            {label && <label>{label}</label>}
                            {labelChildren}
                        </div>
                        <div className='contentBox'>
                            {children}
                        </div>
                    </NoCaptionContext.Provider>)
                    : children }

                {(umButton || transitionChip) &&
                    <div className='contextActionsBox'>{umButton}{transitionChip}</div>}
            </div>
        </NoFocusContext.Provider>
    );
}

const getTransitionChip = (transitionUrl: string): ReactNode => (
    <ChipElement
        identity={{}}
        receiver={false}
        text=''
        tooltip={transitionUrl}
        color={{ tp: 'p', cssClass: 'bodyColorCss' }}
        link={transitionUrl}
        iconPath='/mod/main/ee/cone/core/ui/c4view/link.svg' />
);

function hasSingleChildlessFocusable(elem: HTMLDivElement | null) {
    const focusableDescendants = elem?.querySelectorAll(SEL_FOCUSABLE_ATTR);
    if (!focusableDescendants) return false;
    if (focusableDescendants.length === 1) return true;

    let count = 0;
    for (const elem of focusableDescendants) {
        const focusableInside = elem.querySelector(SEL_FOCUSABLE_ATTR);
        if (!focusableInside) {
            count++;
            if (count > 1) break;
        }
    }
    return count === 1;
}

export { LabeledElement, NoFocusContext };
