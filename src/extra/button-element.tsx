import React, { createElement as $ } from 'react';
import clsx from 'clsx';
import { findFirstParent } from "../main/vdom-util";
import { useFocusControl } from './focus-control';

const ButtonElement = (props) => {
	const elem = React.useRef(null)
	const changing = !!props.value	/*changing*/
	const disabled = props.disabled || changing
	const noAction = !(props.onClick || props.onChange)
	const style = { ...disabled && { opacity: "0.4" } }
	const { focusClass, focusHtml } = useFocusControl(props.path)
	const markerClass = props.marker && `marker-${props.marker}`
	const className = clsx(props.className, focusClass, noAction && 'noAction', markerClass)
	React.useEffect(() => {
		if (props.forwardRef) props.forwardRef.current = elem.current
		elem.current.changing = changing
	}, [changing])
	/*
	const create = el=>(type,params) => {
		const doc =  (el.ownerDocument || el.documentElement.ownerDocument)
		w = getParentW(doc.defaultView)					
		const _params = params && (params.code =="vk" && type =="keydown")?{...params,detail:params}:params //ie11 hack
		return (new w.CustomEvent(type,_params))
	}	
	*/
	React.useEffect(() => {
		const onEnter = e => {
			e.stopPropagation()
			elem.current.click()
			setTimeout(function () {
				const cEvent = eventManager.create(e.target)("cTab", { bubbles: true })
				elem.current.dispatchEvent(cEvent)
			}, 200)
		}
		const onClick = e => {
			if (!disabled && (props.onClick || props.onChange)) {
				e.stopPropagation()
				const w = e.target.ownerDocument.defaultView
				w.setTimeout(() => {
					if (props.onClick) props.onClick(e)
					else if (props.onChange) props.onChange({ target: { headers: { "x-r-action": "change" }, value: "1" } })
				}, (props.delay ? parseInt(props.delay) : 0))
			}
			if(props.url) {
                e.stopPropagation()
                e.preventDefault()
                window.open(props.url)
            }
			const focEl = findFirstParent(el => el.classList.contains("activeFocusWrapper") && el)(elem.current)
			if (focEl) focEl.focus()
			// problem was dropdown in popup: button-option disappear after click, and focus goes to nowhere, and popup closes
		}
		elem.current.addEventListener("enter", onEnter)
		elem.current.addEventListener("click", onClick)
		return () => {
			elem.current.removeEventListener("enter", onEnter)
			elem.current.removeEventListener("click", onClick)
		}
	}, [props.onClick, props.onChange, changing])
	const onMouseOver = (value) => () => {
		if (value) props.onMouseOver && props.onMouseOver()
		else props.onMouseOut && props.onMouseOut()
	}

	const textContent = props.content && $('span', { className: 'text' }, props.content)
	const children = props.children !== props.content && props.children

	return $("button", {
			key: "btn", ref: elem,
			title: props.hint, className,
			style, ...focusHtml,
			onMouseOver: onMouseOver(true), onMouseOut: onMouseOver(false),
		},
		textContent,
		children
	)
}

export { ButtonElement }