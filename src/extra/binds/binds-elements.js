import { createElement as $, useContext, useState, useEffect } from 'react'
import { useBinds, BindKeyData, useProvideBinds, OnPageBindProvider, OnPageBindContext } from './key-binding'
import { KeyBinder } from './key-binder'
import { firstChild } from './binds-utils'
import clsx from 'clsx'

const log = e => {
	if (e && e.ownerDocument && e.ownerDocument.defaultView)
		return () => { }
	// return e.ownerDocument.defaultView.console.log
	else
		return () => { }
}

const GenLabel = (label) => {
	return $("div", { key: "label", className: "bindLabelCssClass" }, [label])
}

const GetButtonCaption = (keyData, buttonCaption) => {
	const getLabel = (label) => { return [GenLabel(label), buttonCaption] }
	const buttonKeyLabel = (keyData != null && keyData.label != null && keyData.label != "") ? getLabel(keyData.label) : buttonCaption;
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
	const { children, buttonCaption, bindSrcId, onChange, prioritized, elemType } = props
	const actionElemType = elemType || 'button'
	const [isValid, setIsValid] = useState(false)
	const groupContext = useContext(OnPageBindContext)
	const [elem, setElem] = useState(null)
	const { bindMap, updateActiveGroup } = useBinds()
	const [keyData, setKeyData] = useState(null)
	const [keyCode, setKeyCode] = useState(null)

	// const [parentGroup, setParentGroup] = useState(null)

	const [checkedChildren, setCheckedChildren] = useState([])

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
		const elCheck = elem !== null
		// if (keyCode == "F1") console.log("set F1, elCheck=" + elCheck + ", isValid=" + isValid + " prioritized=" + prioritized)
		if (elem !== null && isValid) KeyBinder.bind(elem, keyCode, callBack, prioritized)
		//console.log("groupContext for " + bindSrcId + " is: " + groupContext + ", isValid: " + isValid)
		return () => {
			KeyBinder.unbind(callBack)
			// if (keyCode == "F1") console.log("unbind F1, elCheck=" + elCheck + ", isValid=" + isValid + " prioritized=" + prioritized)
			log(elem)("unbind", keyCode)
		}
	}, [elem, keyCode, callBack, isValid]) //groupContext, bindSrcId,


	function generateBtnLabel() {
		return isValid ? GetButtonCaption(keyData, buttonCaption) : buttonCaption;
	}

	const buttonText = (isValid) ? [$("span", { className: "text" }, [generateBtnLabel()])] : [buttonCaption]

	// const updatedPropsClassName = (typeof props.className === "undefined") ? { className: "shortButton" } : { className: props.className + " shortButton" }

	// const customOnClick = (normalOnClick) => {
	// 	return (event) => {
	// 		if (normalOnClick) normalOnClick(event)
	// 		if (event.stopPropagation) event.stopPropagation()
	// 	}
	// }

	// const updateOnClick = (typeof props.onClick === "undefined") ? { onClick: customOnClick() } : { onClick: customOnClick(props.onClick) }

	// const updatedProps = { ...props, ...updatedPropsClassName }// , ...updateOnClick

	useEffect(() => {
		setCheckedChildren(NVL(children, []))
	}, [children])

	const drawNormal = !isValid && checkedChildren === []
	// const bindElement = drawNormal ? $(actionElemType, { ...props }, [buttonText, ...checkedChildren]) : $(actionElemType, { ...updatedProps }, [buttonText, ...checkedChildren])
	// const btnPtops = drawNormal ? props : updatedProps
	const className = clsx(props.className, !drawNormal && 'shortButton')
	// const isEmptyButton = !buttonText.every((e) => e == "") && actionElemType === ButtonElement
	// const spanElem = isEmptyButton ? null : $("span", { ref: setElem }, [$(actionElemType, { ...btnPtops }, [...buttonText, ...checkedChildren])])
	return $("span", { ref: setElem }, [$(actionElemType, { className }, [...buttonText, ...checkedChildren])])
}


const BindGroupElement = (props) => {
	const { children, bindSrcId, groupId, additionChange, forceAtStart, showBtn, additionChangeOnClose, onFocusChange } = props
	const { provideBinds, updateBindProvider } = useProvideBinds(groupId)

	const contextValues = useBinds()
	const { activeBindGroup, updateActiveGroup, addGroup, removeGroup, escapeBindSrcId, haveBackOption,
		goBackInHistory, isBindMode } = contextValues

	const [drawBindBtn, setDrawBindBtn] = useState(null)
	const [drawEscBtn, setDrawEscBtn] = useState(null)

	const [onFocusGroup, setOnFocusGroup] = useState(false)

	const [elem, setElem] = useState(null)

	const onChange = (event) => {
		updateBindProvider()
		//	if (additionChange) additionChange(event)
	}

	// const label = (keyData !== null) ? GenLabel(keyData.label) : null;

	const onFocusChangeFn = (groupId, eventName) => {
		return (event) => {
			console.log("onFocusChange: " + eventName)
			updateActiveGroup(groupId)
		}
	}

	const getBtnProps = (bSrcId, action) => {
		return {
			bindSrcId: bSrcId,
			onChange: action,
			children: ""
		}
	}

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
				el => el.classList && el.classList.contains("focusWrapper"),
				el => el.classList && el.classList.contains("withBindProvider"),
				true)

			const el2 = firstChild(elem,
				el => el.classList && el.hasAttribute("data-path"),
				el => el.classList && el.classList.contains("withBindProvider"),
				true)

			if (active) {
				//console.log("have already active inside: " + gId)
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
					setTimeout(() => { checkForFocus(groupId) }, 200)
					if (additionChange) additionChange()
				}
				return newValue
			})
		}
	}, [groupId, activeBindGroup, elem])

	useEffect(() => {
		setDrawBindBtn(typeof showBtn !== "undefined" && showBtn)
	}, [showBtn])

	useEffect(() => {
		if (drawBindBtn != null) {
			const newVal = drawBindBtn && activeBindGroup === groupId && haveBackOption(groupId)
			// console.log("drawEscBtn for group: " + groupId + " is :" + newVal + ", activeBindGroup: " + activeBindGroup + ", haveBackOption: " + haveBackOption(groupId))
			setDrawEscBtn(newVal)
		}
	}, [drawBindBtn, activeBindGroup, haveBackOption, groupId])

	useEffect(() => {
		if (drawBindBtn != null && !drawBindBtn) addGroup(groupId)
		return () => removeGroup(groupId)
	}, [drawBindBtn])

	useEffect(() => {
		if (activeBindGroup == "" && typeof forceAtStart !== "undefined" && forceAtStart) {
			updateBindProvider()
		}
	}, [activeBindGroup])

	const isDrawEscBtn = drawEscBtn != null && drawEscBtn
	const btn = (drawBindBtn != null && drawBindBtn && !isDrawEscBtn) ? [$(BindingElement, { ...btnProps }, [])] : []
	const escBtn = isDrawEscBtn ? [$(BindingElement, { ...escBtnProps }, [])] : []

	const focusGroupElement = [$("div", { ref: setElem, className: groupId + " withBindProvider", groupId: groupId }, children)]

	const withProvider = () => {
		return $("div", { key: "withBindProvider", style: { display: "inherit", alignItems: "center" } },
			[
				...btn,
				...escBtn,
				OnPageBindProvider({
					childs: focusGroupElement,
					provideBinds
				})
			])
	}
	return isBindMode ? withProvider() : children
}

export { BindingElement, BindGroupElement }
