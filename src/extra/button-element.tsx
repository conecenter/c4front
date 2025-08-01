import React, { createElement as $, useEffect, ReactNode, MutableRefObject } from 'react';
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

const ButtonElement = (props: ButtonElement) => {
	const elem = React.useRef<HTMLButtonElement | null>(null)

	const changing = !!props.value
	const disabled = props.disabled || changing
	const noAction = !(props.onClick || props.onChange)

	const { focusClass, focusHtml } = useFocusControl(props.path)

	const { style: colorStyle, className: colorClass }: ColorProps = colorToProps(props.color);

	const markerClass = props.marker && `marker-${props.marker}`

	useEffect(() => {
		if (props.forwardRef) props.forwardRef.current = elem.current
	}, [changing])

    const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!disabled && !noAction) {
            e.stopPropagation()
			if (props.onClick) props.onClick(e)
			else props.onChange?.({ target: { headers: { "x-r-action": "change" }, value: "1" } })
        }
        if (props.url) {
            e.stopPropagation()
            e.preventDefault()
            window.open(props.url)
        }
    }

	const onEnter = (e: CustomEvent) => {
		e.stopPropagation();
		elem.current?.click();
	}
	useAddEventListener(elem.current, "enter", onEnter);

	const textContent = props.content && $('span', { className: 'text' }, props.content)
	const children = props.children !== props.content && props.children

	return $(Tooltip, { content: props.hint, children:
		$("button", {
			ref: elem, onClick, ...focusHtml, "data-title": props.hint,
			className: clsx(props.className, focusClass, colorClass, noAction && 'noAction', markerClass),
			style: {
				...disabled && { opacity: "0.4", cursor: 'default' },
				...colorStyle
			}
		},
		textContent,
		children)
	});
}

export { ButtonElement }