import React, { createElement as $, useContext, useState, useEffect } from 'react'
import clsx from 'clsx'

import { useBinds, BindKeyData, useProvideBinds, OnPageBindContext } from './key-binding'
import { KeyBinder } from './key-binder'
import { firstChild } from './binds-utils'
import { VISIBLE_CHILD_SEL } from '../main-menu/main-menu-bar'

/*
const initialButtonState = { mouseOver: false, touchStart: false }
const buttonReducer = (state, action) => {
	switch (action.type) {
		case 'mouseOver':
			return { ...state, mouseOver: action.value }
		case 'touchStart':
			return { ...state, touchStart: action.value }
		default:
			return state
	}
}
const BindingButton = (props) => {
	const [state, dispatch] = React.useReducer(buttonReducer, initialButtonState)
	const elem = React.useRef(null)
	const changing = !!props.value
	const disabled = changing ? true : null
	const hasOverStyle = props.className && props.className.split(" ").some(cs => cs.includes("-over"))
	const hasActionStyle = props.onClick || props.onChange ? {} : {cursor: "initial"}
	const style = {
		...hasActionStyle,
		...(state.mouseOver && !hasOverStyle ? { opacity: "0.8" } : null),
		...(disabled ? { opacity: "0.4" } : null)
	}
	const { focusClass, focusHtml } = useFocusControl(props.path)
	const className = clsx(props.className, focusClass)
	React.useEffect(() => {
		if (props.forwardRef) props.forwardRef.current = elem.current
		elem.current.changing = changing
	}, [changing])
	React.useEffect(() => {
		const onEnter = e => {
			//log(`Enter ;`)
			if (typeof e.stopPropagation === "function") { e.stopPropagation() }
			elem.current.click()
		}
		const onClick = e => {
			if (!changing && (props.onClick || props.onChange)) {
				const w = e.target.ownerDocument.defaultView
				w.setTimeout(() => {
					if (props.onClick) { props.onClick(e) }
					else if (props.onChange) { props.onChange({ target: { headers: { "x-r-action": "change" }, value: "1" } }) }
				})
			}
            if(props.url) {
                e.stopPropagation()
                e.preventDefault()
                window.open(props.url)
            }
			if (props.local && typeof e.stopPropagation === "function") {
				e.stopPropagation()
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
		dispatch({ type: 'mouseOver', value })
	}
	const onTouchStart = (value) => () => dispatch({ type: 'touchStart', value })
	const noAction = !(props.onClick || props.onChange) ? {noop: 1} : {}
	return $("button", {
		...noAction,
		title: props.hint, className, key: "btn", 
		style, ref: elem, ...focusHtml,
		onMouseOver: onMouseOver(true), onMouseOut: onMouseOver(false),
		onTouchStart: onTouchStart(true), onTouchEnd: onTouchStart(false)
	}, props.children)
}
*/

const log = e => {
	if (e && e.ownerDocument && e.ownerDocument.defaultView)
		return () => { }
	// return e.ownerDocument.defaultView.console.log
	else
		return () => { }
}

const GenLabel = label =>  $("span", { className: "bindLabelCssClass" }, label)

const GetButtonCaption = (keyData, buttonCaption) => {
	const getLabel = (label) => { return [GenLabel(label), buttonCaption] }
	const buttonKeyLabel = (keyData != null && keyData.label != null && keyData.label != "") ? getLabel(keyData.label) : [buttonCaption];
	return buttonKeyLabel;
}

const NVL = (data, def) => {
	let result
	if (typeof data === "object") result = [data]
	else if (typeof data !== "undefined") result = data
	else result = def
	return result
}

const BindingElement = (props) => {
	const { children, buttonCaption, bindSrcId, onChange, onClick, prioritized, elemType } = props
	// const actionElemType = elemType || 'button'
	const [isValid, setIsValid] = useState(false)
	const groupContext = useContext(OnPageBindContext)
	const [elem, setElem] = useState(null)
	const { bindMap, updateActiveGroup } = useBinds()
	const [keyData, setKeyData] = useState(null)
	const [keyCode, setKeyCode] = useState(null)

	// const [parentGroup, setParentGroup] = useState(null)
	// const [checkedChildren, setCheckedChildren] = useState([])

	useEffect(() => {
		setIsValid(keyCode !== null && (keyCode.startsWith("F") || keyCode === "Enter" || keyCode === "Esc" || groupContext))
	}, [keyData, keyCode, groupContext])

	useEffect(() => {
		setKeyData(BindKeyData(bindMap, bindSrcId))
	}, [bindMap, bindSrcId])

	useEffect(() => {
		setKeyCode((keyData !== null) ? keyData.keyCode : null)
	}, [keyData])

	const callBack = (event) => {
		log(elem)("bind", "do", keyCode)
		// console.log("BindKey do: " + keyCode)
		onChange && onChange({ target: { headers: { "x-r-action": "change" }, value: "1" } })
	}

	const findFirstParent2 = get => el => el && get(el) || el && findFirstParent2(get)(el.parentElement)

	/* useEffect(() => {
		if (elem !== null) {
			const parentGroupElemenet = findFirstParent2(el => el.classList.contains("withBindProvider") && el)(elem)
			setParentGroup(parentGroupElemenet)
		}
	}, [elem]) */

	useEffect(() => {
		// if (keyCode == "F1") console.log("set F1, elCheck=" + elCheck + ", isValid=" + isValid + " prioritized=" + prioritized)
		if (elem !== null && isValid) KeyBinder.bind(elem, keyCode, callBack, prioritized)
		//console.log("groupContext for " + bindSrcId + " is: " + groupContext + ", isValid: " + isValid)
		return () => {
			KeyBinder.unbind(callBack)
			// if (keyCode == "F1") console.log("unbind F1, elCheck=" + elCheck + ", isValid=" + isValid + " prioritized=" + prioritized)
			log(elem)("unbind", keyCode)
		}
	}, [elem, keyCode, callBack, isValid]) //groupContext, bindSrcId,

	const buttonText = isValid ? GetButtonCaption(keyData, buttonCaption) : [buttonCaption]

	// const customOnClick = (normalOnClick) => {
	// 	return (event) => {
	// 		if (normalOnClick) normalOnClick(event)
	// 		if (event.stopPropagation) event.stopPropagation()
	// 	}
	// }
	// const updateOnClick = (typeof props.onClick === "undefined") ? { onClick: customOnClick() } : { onClick: customOnClick(props.onClick) }
	/*
	useEffect(() => {
		setCheckedChildren(NVL(children, []))
	}, [children])
	*/
	const checkedChildren = NVL(children, [])
	const drawNormal = !isValid && checkedChildren === []
	const className = clsx(props.className, !drawNormal && 'shortButton')
	// const isEmptyButton = !buttonText.every((e) => e == "") && actionElemType === ButtonElement
	// const spanElem = isEmptyButton ? null : $("span", { ref: setElem }, [$(actionElemType, { ...btnPtops }, [...buttonText, ...checkedChildren])])
	return $('button', { ref: setElem, className, onClick: onClick || onChange }, [...buttonText, ...checkedChildren])
}

const BindGroupElement = (props) => {
	const { bindSrcId, groupId, showBtn, forceAtStart, additionChange, additionChangeOnClose, children } = props
	const { activeBindGroup, updateActiveGroup, addGroup, removeGroup, escapeBindSrcId, haveBackOption,
		goBackInHistory, isBindMode } = useBinds()

	if (!isBindMode) return children

	const { provideBinds, updateBindProvider } = useProvideBinds(groupId)

	// const [drawBindBtn, setDrawBindBtn] = useState(null)
	const [drawEscBtn, setDrawEscBtn] = useState(null)

	const [onFocusGroup, setOnFocusGroup] = useState(false)

	const [elem, setElem] = useState(null)

	const onChange = (event) => {
		updateBindProvider()
		//	if (additionChange) additionChange(event)
	}

	const onFocusChangeFn = (groupId, eventName) => {
		return (event) => {
			console.log("onFocusChange: " + eventName)
			updateActiveGroup(groupId)
		}
	}

	const getBtnProps = (bSrcId, action) => ({
		bindSrcId: bSrcId,
		onChange: action,
		children: ""
	})

	const onChangeBack = (event) => {
		goBackInHistory(event)
		//if (onFocusGroup && additionChangeOnClose) additionChangeOnClose(event)
	}

	const btnProps = getBtnProps(bindSrcId, onChange)
	const escBtnProps = getBtnProps(escapeBindSrcId, onChangeBack)

	const checkForFocus = (gId) => {
		if (elem !== null) {
			const active = firstChild(elem,
				el => el.classList && el.classList.contains("activeFocusWrapper"),
				el => el.classList && el.classList.contains("activeFocusWrapper"),
				true)

			const el = firstChild(elem,
				el => el.classList && el.classList.contains("focusWrapper") && el.matches(VISIBLE_CHILD_SEL),
				el => el.classList && el.classList.contains("withBindProvider"),
				true)

			const el2 = firstChild(elem,
				el => el.classList && el.hasAttribute("data-path"),
				el => el.classList && el.classList.contains("withBindProvider"),
				true)

			if (active) {
				// console.log("have already active inside: " + gId)
			} else if (el) {
				// console.log("found focusWrapper in: " + gId)
				// console.log(el)
				el.focus()
			} else if (el2) {
				// console.log("found el with data-path in: " + gId)
				// console.log(el2)
				el2.focus()
			} else {
				// elem.focus()
				// console.log("NOT found focusWrapper in element: " + gId)
			}
		}
	}

	useEffect(() => {
		if (elem !== null) {
			setOnFocusGroup((prev) => {
				const newValue = groupId === activeBindGroup
				if (prev && !newValue && additionChangeOnClose) additionChangeOnClose()
				if (!prev && newValue) {
					checkForFocus(groupId)
					// setTimeout(() => { checkForFocus(groupId) }, 200)
					if (additionChange) additionChange()
				}
				return newValue
			})
		}
	}, [groupId, activeBindGroup, elem])

	// useEffect(() => {
	// 	setDrawBindBtn(typeof showBtn !== "undefined" && showBtn)
	// }, [showBtn])

	useEffect(() => {
		if (showBtn) {
			const newVal = activeBindGroup === groupId && haveBackOption(groupId)
			// console.log("drawEscBtn for group: " + groupId + " is :" + newVal + ", activeBindGroup: " + activeBindGroup + ", haveBackOption: " + haveBackOption(groupId))
			setDrawEscBtn(newVal)
		}
	}, [showBtn, activeBindGroup, haveBackOption, groupId])

	useEffect(() => {
		if (!showBtn) addGroup(groupId)
		return () => removeGroup(groupId)
	}, [showBtn])

	useEffect(() => {
		if (activeBindGroup == "" && forceAtStart) updateBindProvider()
	}, [activeBindGroup])

	const btn = (showBtn && !drawEscBtn) ? [$(BindingElement, { ...btnProps }, [])] : []
	const escBtn = drawEscBtn ? [$(BindingElement, { ...escBtnProps }, [])] : []

	// const focusGroupElement = [$("div", { ref: setElem, className: groupId + " withBindProvider", groupId: groupId }, children)]

	return $('div', {ref: setElem, className: groupId + " withBindProvider", groupId: groupId, style: { display: "inherit", alignItems: "center" }}, [
		...btn,
		...escBtn,
		$(OnPageBindContext.Provider, {value: provideBinds}, children)
	])
}

export { BindingElement, BindGroupElement }
