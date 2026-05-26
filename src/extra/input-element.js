import React, { createElement as $, useContext, useRef, useLayoutEffect } from 'react';
import clsx from 'clsx';
import { useFocusControl } from './focus-control';
import { InputsSizeContext } from "./dom-utils";
import { VkInfoContext } from './ui-info-provider';
import { Tooltip } from './tooltip';
import { clamp } from './utils';
import { SEL_FOCUS_FRAME } from './css-selectors';
import { useAddEventListener } from './custom-hooks';

const HEADERS_CHANGE = { headers: { "x-r-action": "change" } };

const execCopy = (e) =>  e&&e.ownerDocument.execCommand('copy')
const execCut = (e) =>  e&&e.ownerDocument.execCommand('cut')

const validateInput = (inputStr, regexStr, skipInvalidSymbols, upperCase) => {
    if (!inputStr) return '';
    const casedStr = upperCase ? inputStr.toUpperCase() : inputStr;
    if (!regexStr) return casedStr;
    const regex = new RegExp(skipInvalidSymbols ? regexStr : `^${regexStr}*$`, 'g');
    const validatedStr = casedStr.match(regex)?.join('');
    return validatedStr || '';
}

// Extract cursor pos logic into a hook
// Return removed inp from onChange calls
// TODO: Esc doesn't work properly
function InputElementBase({
    value, type, inputType, typeKey: name, placeholder, alignRight, decorators, rows, uctext, dataType, changing, inputRegex, skipInvalidSymbols,
    onChange, onBlur, onFocus, onKeyDown, ...props
}) {
    const inputSize = useContext(InputsSizeContext);
    const { haveVk } = useContext(VkInfoContext);

    const inputRef = useRef(null);

    const readOnly = !onChange && !onBlur;

    const { before, after } = decorators || {};
    function getDecoratedElem(text) {
        return $(Tooltip, { content: text, children:
            $('span', { className: 'decorator', onClick: () => inputRef.current?.focus() }, text)
        })
    }

    const kRef = useRef(null);
    const sRef = useRef(null);

    const prevVal = useRef(null);

    function handleChange(e) {
        if (!onChange) return;
        kRef.current = inputRef.current.selectionStart;
        if (sRef.current !== null && sRef.current !== undefined) {
            kRef.current = sRef.current;
            sRef.current = null
        }
        const value = uctext ? e.target.value.toUpperCase() : e.target.value;
        onChange({ target: { ...HEADERS_CHANGE, value }, inp: inputRef.current });
    }

    function handleBlur() {
        const value = inputRef.current.value;
        prevVal.current = value;
        onBlur?.({
            target: { ...HEADERS_CHANGE, value },
            replaceLastPatch: true
        });
    }

    function onBeforeInput(e) {
        if (e.data && inputRegex) {
            const validatedStr = validateInput(e.data, inputRegex, skipInvalidSymbols, uctext);
            if (validatedStr === e.data) return;
            e.preventDefault();
            if (validatedStr && e.defaultPrevented)
                inputRef.current?.ownerDocument.execCommand("insertText", false, validatedStr);
        }
    }

    function onClick(e){
        if (!readOnly) e.stopPropagation()
    }

    function handleKeyDown(e) {
        if(!inputRef.current) return;
        if (onKeyDown?.(e)) return;
        switch (e.key) {
            case "Escape":
                if (prevVal.current !== undefined && inputRef.current.value !== prevVal.current) {
                    handleChange({ target: { value: prevVal.current } });
                }
                queueMicrotask(() => inputRef.current.closest(SEL_FOCUS_FRAME)?.focus());
                e.stopPropagation();
                break;
            case "Enter":
                e.preventDefault();
                onEnter(e);
                // fall through
            case "Tab":
            case "F2":
                break;
            default:
                // Stop propagation from focused input to FocusModule - avoid extra work
                e.stopPropagation();
        }
    }

    const isInputFocused = () =>
        inputRef.current && inputRef.current === inputRef.current?.ownerDocument?.activeElement;

    function onDelete(event) {
        event.stopPropagation();
        const inp = inputRef.current;
        sRef.current = null;
        if (!isInputFocused()) {
            inp.focus();
            prevVal.current = inp.value;
            let nValue;
            if (isVkEvent(event)) {
                const validatedStr = validateInput(event.detail?.key, inputRegex, skipInvalidSymbols, uctext);
                nValue = validatedStr
                sRef.current = validatedStr.length
            } else nValue = ""
            handleChange({ target: { ...HEADERS_CHANGE, value: nValue } })
        }
        else if (isVkEvent(event)) {
            const validatedStr = validateInput(event.detail?.key, inputRegex, skipInvalidSymbols, uctext);
            let nValue = inp.value
            if (!event.detail.key) {    // delete key case
                const newSelectionStart = inp.selectionStart === inp.selectionEnd
                    ? inp.selectionStart - 1
                    : inp.selectionStart
                nValue = nValue.substring(0, newSelectionStart) + nValue.substring(inp.selectionEnd)
                sRef.current = newSelectionStart < 0 ? 0 : newSelectionStart
            } else {
                const value1 = nValue.substring(0, inp.selectionStart)
                const value2 = nValue.substring(inp.selectionEnd)
                nValue = value1 + validatedStr + value2
                sRef.current = inp.selectionStart + 1
            }
            handleChange({ target: { ...HEADERS_CHANGE, value: nValue } })
        }
    }

    function onBackspace(event){
        event.stopPropagation();
        const inp = inputRef.current;
        if (!isInputFocused()) {
            inp.focus();
            prevVal.current = inp.value;
            const nValue = isVkEvent(event) ? inp.value.slice(0, -1) : inp.value
            sRef.current = nValue.length;
            handleChange({ target: { ...HEADERS_CHANGE, value: nValue } });
        }
        else if (isVkEvent(event)) {
            let nValue = inp.value
            const value1 = nValue.substring(0, inp.selectionStart - 1)
            const value2 = nValue.substring(inp.selectionEnd)
            nValue = value1 + value2
            sRef.current = inp.selectionStart - 1
            handleChange({ target: { ...HEADERS_CHANGE, value: nValue } })
        }
    }

    function onEnter(event) {
        const inp = inputRef.current;
        if (isVkEvent(event) || isInputFocused()) {
            const markerButton = props.mButtonEnter
            const window = event.target.ownerDocument.defaultView
            let cEvent
            if (markerButton) {
                cEvent = new window.CustomEvent("cEnter", { bubbles: true, detail: markerButton })
                if (onBlur) onBlur()
                else onChange?.({ target: { ...HEADERS_CHANGE, value: inp.value } })
            }
            else if (!props.lockedFocus) {
                cEvent = new window.CustomEvent("cTab", { bubbles: true })
            }
            cEvent && inp.dispatchEvent(cEvent)
        }
        else {
            inp.focus();
            prevVal.current = inp.value
            inp.selectionEnd = inp.value.length
            inp.selectionStart = inp.value.length
        }
        event.stopPropagation()
    }

    function onClear() {
        const inp = inputRef.current;
        inp.value = "";
        if (onChange) onChange({ target: { ...HEADERS_CHANGE, value: inp.value }, inp })
        if (!isInputFocused()) onBlur?.();  // TODO: code smell
    }

    function onCPaste(e) {
        if (!isInputFocused()) {
            const inp = inputRef.current;
            inp?.focus();
            inp?.setSelectionRange(0, inp.value.length);
        }
        e.stopPropagation();
    }

    function onCopy(event){
         if (!isInputFocused()) {
            const inp = inputRef.current;
            inp?.focus();
            inp?.setSelectionRange(0, inp.value.length);
            execCopy(inp);
        }
        event.stopPropagation();
    }

    function onCut(event){
         if (!isInputFocused()) {
            const inp = inputRef.current;
            inp?.focus();
            inp.setSelectionRange(0, inp.value.length)
            execCut(inp);
            inp.blur();
        }
        event.stopPropagation();
    }

    useLayoutEffect(() => {
        if (kRef.current !== null) {
            inputRef.current.selectionStart = kRef.current;
            inputRef.current.selectionEnd = kRef.current;
            kRef.current = null;
        }
    });

    useAddEventListener(inputRef, 'enter', onEnter);
    useAddEventListener(inputRef, 'delete', onDelete);
    useAddEventListener(inputRef, 'erase', onClear);
    useAddEventListener(inputRef, 'clear', onClear);
    useAddEventListener(inputRef, 'backspace', onBackspace);
    useAddEventListener(inputRef, 'cpaste', onCPaste);
    useAddEventListener(inputRef, 'ccopy', onCopy);
    useAddEventListener(inputRef, 'ccut', onCut);

    return $(React.Fragment, null,
        before && getDecoratedElem(before),
        $(inputType || "input", {
            value, name, readOnly,
            ref: inputRef,
            size: inputSize,
            style: {
                ...alignRight && { textAlign: "end" },
                ...decorators && { width: `${clamp((value ?? '').length + 1.5, 0, 15)}ch` }
            },
            type: type || "text",
            rows: rows || '2',
            placeholder: placeholder || "",
            ...uctext && { className: "uppercase" },
            ...haveVk && { inputMode: 'none' },
            ...name && { autoComplete: "new-password" },
            "data-type": dataType,   // VK reads it
            "data-changing": changing,  // for tests
            onChange: handleChange,
            onKeyDown: handleKeyDown,
            onBlur: handleBlur, onFocus,
            onBeforeInput, onClick
        }),
        after && getDecoratedElem(after)
    );
}

function isVkEvent(event) {
    return event.detail && typeof event.detail == "object" ? event.detail.vk : false;
}

const InputElement = ({
    className, path, children,
    buttonElement,
    alignRight, ...props
}) => {
    const { focusClass, focusHtml } = useFocusControl(path);
    const readOnly = !props.onChange && !props.onBlur;

    const sideContent = Array.isArray(children)
        ? children.filter(c => c.props.className.split(' ').includes("sideContent"))
        : null;

    const classes = clsx("inputBox", focusClass, className, props.decorators && 'decorated');
    const style = readOnly ? { borderColor: 'transparent' } : undefined;

    return $("div", { style, className: classes, ...focusHtml },
        alignRight && sideContent,
        $(InputElementBase, { ...props, alignRight }),
        buttonElement,
        !alignRight && sideContent
    );
}

export { InputElement, InputElementBase }