import React, { createElement as $, ReactNode, MutableRefObject } from 'react';
import clsx from 'clsx';
import { findFirstParent } from "../main/vdom-util";
import { useFocusControl } from './focus-control';
import { Patch } from './exchange/patch-sync';

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
    forwardRef?: MutableRefObject<HTMLButtonElement | null>
}

const ButtonElement = (props: ButtonElement) => {
	const elem = React.useRef<HTMLButtonElement | null>(null)

	const changing = !!props.value
	const disabled = props.disabled || changing
	const noAction = !(props.onClick || props.onChange)

	const { focusClass, focusHtml } = useFocusControl(props.path)

	const markerClass = props.marker && `marker-${props.marker}`

	React.useEffect(() => {
		if (props.forwardRef) props.forwardRef.current = elem.current
	}, [changing])

    const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!disabled && (props.onClick || props.onChange)) {
            e.stopPropagation()
			if (props.onClick) props.onClick(e)
			else props.onChange?.({ target: { headers: { "x-r-action": "change" }, value: "1" } })
        }
        if (props.url) {
            e.stopPropagation()
            e.preventDefault()
            window.open(props.url)
        }
        const focEl = findFirstParent((el: HTMLElement) => el.classList.contains("activeFocusWrapper") && el)(elem.current)
        if (focEl) focEl.focus()
        // problem was dropdown in popup: button-option disappear after click, and focus goes to nowhere, and popup closes
    }

	React.useEffect(() => {
		const onEnter = (e: CustomEvent) => {
			e.stopPropagation()
			elem.current?.click()
			const cEvent = createCustomEvent('cTab', elem.current)
			if (cEvent) elem.current?.dispatchEvent(cEvent)
		}
		elem.current?.addEventListener("enter", onEnter)
		return () => {
			elem.current?.removeEventListener("enter", onEnter)
		}
	}, [props.onClick, props.onChange, changing])

	const textContent = props.content && $('span', { className: 'text' }, props.content)
	const children = props.children !== props.content && props.children

	return $("button", {
			key: "btn", ref: elem,
            onClick, title: props.hint, ...focusHtml,
            className: clsx(props.className, focusClass, noAction && 'noAction', markerClass),
			style: disabled ? { opacity: "0.4" } : undefined,
			onKeyDown: (e) => e.preventDefault()
		},
		textContent,
		children
	)
}

function createCustomEvent(name: string, elem: HTMLElement | null) {
	const window = elem?.ownerDocument.defaultView;
	return window ? new window.CustomEvent(name, { bubbles: true }) : undefined;
}

export { ButtonElement }