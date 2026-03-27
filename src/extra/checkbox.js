import { createElement as $, useState } from 'react'
import clsx from 'clsx'
import { useFocusControl } from './focus-control'
import { useExternalKeyboardControls } from './focus-module-interface'
import { Tooltip } from './tooltip'

const CheckboxElement = (props) => {
    const getChildrenByClass = (cl) => {
        if(!Array.isArray(props.children)) return;
        return props.children.filter(c=>c.props.at?c.props.at.className.split(' ').includes(cl):c.props.className.split(' ').includes(cl))
    }

    const onClick = e=>{
        props.onChange?.({target:{headers:{"x-r-action":"change"},value:(props.value?"":"checked")}})
        e.stopPropagation()
        e.nativeEvent?.stopImmediatePropagation()
    }

    const [checkboxElem, setCheckboxElem] = useState(null)
    const onKeyboardAction = e => {
        if (e.detail) onClick(e)
    }
    const keyboardEventHandlers = {
		enter: onKeyboardAction,
		delete: onKeyboardAction,
	};
    useExternalKeyboardControls(checkboxElem, keyboardEventHandlers)

    const readOnly = !(props.onChange || props.onBlur);

    const stateClass = props.value === 'unknown' ? 'isUnknown'
        : props.value ? 'isChecked' : '';

    const errorChildren = getChildrenByClass("sideContent")

    const {focusClass, focusHtml} = useFocusControl(props.path);

    return $("div", {ref: setCheckboxElem, className: clsx("checkBox", focusClass), ...focusHtml},
        $(Tooltip, { content: props.tooltip },
            $("div", {
                ...props.changing && { style: { opacity: "0.4" }},
                className: clsx(props.isRadioButton ? 'radioButton' : 'imageBox', stateClass, props.className),
                "data-title": props.tooltip,
                onClick, readOnly
            })
        ),
        errorChildren,
        props.label && $("label", {onClick}, props.label)
    );
}

const RadioButtonElement = (props) => $(CheckboxElement, { ...props, isRadioButton: true });

export {CheckboxElement, RadioButtonElement}