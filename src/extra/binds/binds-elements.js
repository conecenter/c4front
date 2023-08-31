import { createElement as $, useContext, useState, useEffect } from 'react'
import clsx from 'clsx'

import { useBinds, BindKeyData, useProvideBinds, OnPageBindContext } from './key-binding'
import { KeyBinder } from './key-binder'
import { firstChild } from './binds-utils'
import { VISIBLE_CHILD_SEL } from '../main-menu/main-menu-bar'
import { useFocusControl } from '../focus-control'
import { TAB_EVENT } from '../focus-module-interface'
import { useAddEventListener } from '../custom-hooks'


const GetButtonCaption = (keyData, buttonCaption) => {
	const getLabel = (label) => {
		const labelEl = $("span", { className: "bindLabelCssClass" }, label);
		return [labelEl, label !== buttonCaption ? buttonCaption : undefined];
	}
	return (keyData != null && keyData.label != null && keyData.label != "") ? getLabel(keyData.label) : [buttonCaption];
}

const NVL = (data, def) => {
	let result
	if (typeof data === "object") result = [data]
	else if (typeof data !== "undefined") result = data
	else result = def
	return result
}

const BindingElement = (props) => {
	const { children, buttonCaption, bindSrcId, onChange, onClick, prioritized/*, elemType*/ } = props
	// const actionElemType = elemType || 'button'
	const [isValid, setIsValid] = useState(false)
	const groupContext = useContext(OnPageBindContext)
	const [elem, setElem] = useState(null)
	const { bindMap } = useBinds()
	const [keyData, setKeyData] = useState(null)
	const [keyCode, setKeyCode] = useState(null)

	const { focusClass, focusHtml } = useFocusControl(props.path)

	useEffect(() => {
		setIsValid(keyCode !== null && (keyCode.startsWith("F") || keyCode === "Enter" || keyCode === "Esc" || groupContext))
	}, [keyData, keyCode, groupContext])

	useEffect(() => {
		setKeyData(BindKeyData(bindMap, bindSrcId))
	}, [bindMap, bindSrcId])

	useEffect(() => {
		setKeyCode((keyData !== null) ? keyData.keyCode : null)
	}, [keyData])

	const callBack = () => onChange?.({
		target: {
			headers: { "x-r-action": "change" },
			value: "1"
		}
	})

	useEffect(() => {
		if (elem !== null && isValid) KeyBinder.bind(elem, keyCode, callBack, prioritized)
		return () => {
			KeyBinder.unbind(callBack)
		}
	}, [elem, keyCode, callBack, isValid])

	const buttonText = isValid ? GetButtonCaption(keyData, buttonCaption) : [buttonCaption]

	const checkedChildren = NVL(children, [])
	const drawNormal = !isValid && checkedChildren === []
	const noAction = !(onClick || onChange)
	const className = clsx(props.className, focusClass, !drawNormal && 'shortButton', noAction && 'noAction')
	return $('button', { ref: setElem, className, ...focusHtml, onClick: onClick || onChange }, [...buttonText, ...checkedChildren])
}

const BindGroupElement = (props) => {
	const { bindSrcId, groupId, showBtn, forceAtStart, additionChange, additionChangeOnClose, children } = props
	const { activeBindGroup, addGroup, removeGroup, escapeBindSrcId, haveBackOption, goBackInHistory, isBindMode } = useBinds()

	if (!isBindMode) return children;

	const { provideBinds, updateBindProvider } = useProvideBinds(groupId)

	const [drawEscBtn, setDrawEscBtn] = useState(null)

	const [onFocusGroup, setOnFocusGroup] = useState(false)

	const [elem, setElem] = useState(null)

	const onChange = () => updateBindProvider()

	const getBtnProps = (bSrcId, action) => ({
		bindSrcId: bSrcId,
		onChange: action,
		children: ""
	})

	const onChangeBack = (event) => goBackInHistory(event)

	const btnProps = getBtnProps(bindSrcId, onChange)
	const escBtnProps = getBtnProps(escapeBindSrcId, onChangeBack)

	const checkForFocus = () => {
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

			if (!active) (el || el2)?.focus();
		}
	}

	useEffect(() => {
		if (elem !== null) {
			setOnFocusGroup((prev) => {
				const newValue = groupId === activeBindGroup
				if (prev && !newValue && additionChangeOnClose) additionChangeOnClose()
				if (!prev && newValue) {
					checkForFocus(groupId)
					if (additionChange) additionChange()
				}
				return newValue
			})
		}
	}, [groupId, activeBindGroup, elem])

	useEffect(() => {
		if (showBtn) {
			const newVal = activeBindGroup === groupId && haveBackOption(groupId)
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

	const tabInsideGroup = (e) => {
		e.preventDefault();
		e.stopPropagation();
		const currFocusedElement = e.target?.closest('.focusWrapper');
		const groupFocusables = Array.from(elem.querySelectorAll(`.focusWrapper${VISIBLE_CHILD_SEL}`));
		const currFocusedIndex = groupFocusables.findIndex(elem => elem === currFocusedElement);
		const nextFocusableIndex = (currFocusedIndex + 1 + groupFocusables.length) % groupFocusables.length;
		groupFocusables[nextFocusableIndex]?.focus();
	}
	useAddEventListener(elem, TAB_EVENT, tabInsideGroup);

	return $('div', {
		ref: setElem,
		className: groupId + " withBindProvider",
		groupId,
		style: { display: "inherit", alignItems: "center" },
		onKeyDown: (e) => e.key === 'Tab' && tabInsideGroup(e)
	}, [
		...btn,
		...escBtn,
		$(OnPageBindContext.Provider, {value: provideBinds}, children)
	])
}

export { BindingElement, BindGroupElement }