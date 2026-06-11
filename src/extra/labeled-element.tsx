import React, { useContext, useEffect, useRef, useState, CSSProperties, ReactElement } from 'react';
import clsx from 'clsx';
import { HorizontalCaptionContext, NoCaptionContext, usePath } from '../main/vdom-hooks';
import { useFocusControl } from './focus-control';
import { SEL_FOCUS_FRAME } from './css-selectors';
import { ContextActionsElement } from './context-actions-element';
import { Tooltip } from './tooltip';
import { LabeledElementProps } from 'c4f/sapi/ee/cone/c4ui/c4gen.FrontTags';

type ClientProps<T extends { identity: object; children?: ReactElement[] }> =
    Omit<T, 'identity' | 'children'> & {
      identity?: object
      children?: ReactElement | ReactElement[]
      className?: string
    }

function LabeledElement(
    { identity, label, sizes, labelChildren, umid, goToChip, children, ...props }: ClientProps<LabeledElementProps>
) {
    const showCaption = !useContext(NoCaptionContext);
    const isHorizontalCaption = useContext(HorizontalCaptionContext);

    const isEmptyLabel = !(label || labelChildren);

    const path = usePath(identity);
    const { focusClass, focusHtml } = useFocusControl(isEmptyLabel ? '' : path);

    // Disable focusable descendants focus if LE has single childless focusable descendant
    const [disableChildFocus, setDisableChildFocus] = useState(false);
    const refLE = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (isEmptyLabel) setDisableChildFocus(false);
        else setDisableChildFocus(hasSingleChildlessFocusable(refLE.current));
    }, [isEmptyLabel, labelChildren, children]);

    const className = clsx(
        'labeledElement',
        focusClass,
        // accented && 'accented',
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
    };

    return (
        <Tooltip content={props.hint}>
            <div ref={refLE}
                className={className}
                {...focusHtml}
                style={style}
                data-umid={umid}
                data-title={props.hint}
            >
                {showCaption ? (
                    <NoCaptionContext.Provider value={true}>
                        <div className='labelBox'>
                            {label && <label>{label}</label>}
                            {labelChildren}
                        </div>
                        <div className='contentBox'>{children}</div>
                    </NoCaptionContext.Provider>)
                    : children }

                    {(umid || goToChip) &&
                        <ContextActionsElement umid={umid} goToChip={goToChip} refLE={refLE} />}
            </div>
        </Tooltip>
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