import React, { createElement as $, useState, useEffect, ReactNode, MutableRefObject } from 'react';
import clsx from 'clsx';
import { useFocusControl } from './focus-control';
import { Patch } from './exchange/patch-sync';
import { ColorDef, ColorProps, colorToProps } from './view-builder/common-api';
import { useAddEventListener } from './custom-hooks';
import { Tooltip } from './tooltip';

interface ButtonElement {
    value: boolean | '1' | '',
    onClick?: (e: React.MouseEvent) => void,
    onChange?: (e: { target: Patch }) => void,
    path?: string,
    content?: string,
    children?: ReactNode,
    disabled?: boolean,
    marker?: string,
    url?: string,
    hint?: string,
	className?: string,
	color?: ColorDef,
    forwardRef?: MutableRefObject<HTMLButtonElement | null>
}

const ButtonElement = ({ onClick, onChange, content, ...props}: ButtonElement) => {
	const [elem, setElem] = useState<HTMLButtonElement | null>(null);

	const changing = !!props.value
	const disabled = props.disabled || !(onClick || onChange)

	const { focusClass, focusHtml } = useFocusControl(props.path)

	const { style: colorStyle, className: colorClass }: ColorProps = colorToProps(props.color);

	const markerClass = props.marker && `marker-${props.marker}`

	useEffect(() => {
		if (props.forwardRef) props.forwardRef.current = elem
	}, [changing])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!disabled) {
            e.stopPropagation()
			if (onClick) onClick(e)
			else onChange?.({ target: { headers: { "x-r-action": "change" }, value: "1" } })
        }
        if (props.url) {
            e.stopPropagation()
            e.preventDefault()
            window.open(props.url)
        }
    }

	const onEnter = (e: CustomEvent) => {
		e.stopPropagation();
		elem?.click();
	}
	useAddEventListener(elem, "enter", onEnter);

	const textContent = content && $('span', { className: 'text' }, content)
	const children = props.children !== content && props.children

	return $(Tooltip, { content: props.hint, children:
		$("button", {
			ref: setElem, onClick: handleClick, ...focusHtml, "data-title": props.hint,
			className: clsx(props.className, focusClass, colorClass, disabled && 'disabled', markerClass),
			style: {
				...changing && { opacity: "0.4", cursor: 'default' },
				...colorStyle
			}
		},
		textContent,
		children)
	});
}

export { ButtonElement }