import React, { createElement as $, useContext, useRef, useLayoutEffect } from 'react';
import clsx from 'clsx';
import { useFocusControl } from './focus-control';
import { InputsSizeContext } from "./dom-utils";
import { VkInfoContext } from './ui-info-provider';
import { Tooltip } from './tooltip';
import { clamp } from './utils';
import { SEL_FOCUS_FRAME } from './css-selectors';
import { useAddEventListener } from './custom-hooks';
import { mergeRefs } from './utils-react';

const HEADERS_CHANGE = { headers: { "x-r-action": "change" } };

const execCopy = (e: HTMLInputElement | null) => e && e.ownerDocument.execCommand('copy');
const execCut = (e: HTMLInputElement | null) => e && e.ownerDocument.execCommand('cut');

type InputChangeTarget = { headers: { 'x-r-action': string }, value: string }
type InputChangeEvent = { target: InputChangeTarget, inp?: HTMLInputElement | null }
type InputBlurEvent = { target: InputChangeTarget, replaceLastPatch?: boolean }
type VkDetail = { vk: boolean, key?: string }

interface InputElementBaseProps {
    value?: string
    type?: string
    inputType?: "input" | "textarea"
    typeKey?: string
    placeholder?: string
    alignRight?: boolean
    decorators?: { before?: string, after?: string }
    rows?: string
    uctext?: boolean
    dataType?: string
    changing?: string
    inputRegex?: string
    skipInvalidSymbols?: boolean
    onChange?: (e: InputChangeEvent) => void
    onBlur?: (e?: InputBlurEvent) => void
    onFocus?: React.FocusEventHandler<HTMLInputElement>
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => boolean | void
    mButtonEnter?: string
    lockedFocus?: boolean
    _ref?: React.Ref<HTMLInputElement>
}

// TODO: extract cursor pos logic into a hook
function InputElementBase({
    value, type, inputType, typeKey: name, placeholder, alignRight, decorators, rows, uctext, dataType, changing, inputRegex, skipInvalidSymbols,
    onChange, onBlur, onFocus, onKeyDown, mButtonEnter, lockedFocus, _ref = null
}: InputElementBaseProps): React.ReactElement {
    const inputSize = useContext(InputsSizeContext);
    const { haveVk } = useContext(VkInfoContext);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const kRef = useRef<number | null>(null);
    const sRef = useRef<number | null>(null);
    const prevVal = useRef<string | null>(null);

    const readOnly = !onChange && !onBlur;

    const { before, after } = decorators || {};
    function getDecoratedElem(text: string) {
        return $(Tooltip, { content: text, children:
            $('span', { className: 'decorator', onClick: () => inputRef.current?.focus() }, text)
        })
    }

    function handleChange(e: { target: { value: string } }) {
        if (!onChange) return;
        kRef.current = inputRef.current!.selectionStart;
        if (sRef.current !== null) {
            kRef.current = sRef.current;
            sRef.current = null;
        }
        const value = uctext ? e.target.value.toUpperCase() : e.target.value;
        onChange({ target: { ...HEADERS_CHANGE, value }, inp: inputRef.current });
    }

    function handleBlur() {
        const value = inputRef.current!.value;
        prevVal.current = value;
        onBlur?.({ target: { ...HEADERS_CHANGE, value }, replaceLastPatch: true });
    }

    function onBeforeInput(e: InputEvent) {
        if (e.data && inputRegex) {
            const validatedStr = validateInput(e.data, inputRegex, skipInvalidSymbols, uctext);
            if (validatedStr === e.data) return;
            e.preventDefault();
            if (validatedStr && e.defaultPrevented)
                inputRef.current?.ownerDocument.execCommand("insertText", false, validatedStr);
        }
    }

    function onClick(e: React.MouseEvent) {
        if (!readOnly) e.stopPropagation();
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!inputRef.current) return;
        if (onKeyDown?.(e)) return;
        switch (e.key) {
            case "Escape":
                if (prevVal.current !== null && inputRef.current.value !== prevVal.current) {
                    handleChange({ target: { value: prevVal.current } });
                }
                queueMicrotask(() => inputRef.current?.closest<HTMLElement>(SEL_FOCUS_FRAME)?.focus());
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
        inputRef.current !== null && inputRef.current === inputRef.current.ownerDocument?.activeElement;

    function onDelete(event: CustomEvent) {
        event.stopPropagation();
        const inp = inputRef.current!;
        sRef.current = null;
        if (!isInputFocused()) {
            inp.focus();
            prevVal.current = inp.value;
            let nValue: string;
            if (isVkEvent(event)) {
                const validatedStr = validateInput(event.detail?.key, inputRegex, skipInvalidSymbols, uctext);
                nValue = validatedStr;
                sRef.current = validatedStr.length;
            } else nValue = "";
            handleChange({ target: { ...HEADERS_CHANGE, value: nValue } });
        }
        else if (isVkEvent(event)) {
            const validatedStr = validateInput(event.detail?.key, inputRegex, skipInvalidSymbols, uctext);
            let nValue = inp.value;
            if (!event.detail.key) {    // delete key case
                const newSelectionStart = inp.selectionStart === inp.selectionEnd
                    ? inp.selectionStart! - 1
                    : inp.selectionStart!;
                nValue = nValue.substring(0, newSelectionStart) + nValue.substring(inp.selectionEnd!);
                sRef.current = newSelectionStart < 0 ? 0 : newSelectionStart;
            } else {
                const value1 = nValue.substring(0, inp.selectionStart!);
                const value2 = nValue.substring(inp.selectionEnd!);
                nValue = value1 + validatedStr + value2;
                sRef.current = inp.selectionStart! + 1;
            }
            handleChange({ target: { ...HEADERS_CHANGE, value: nValue } });
        }
    }

    function onBackspace(event: CustomEvent) {
        event.stopPropagation();
        const inp = inputRef.current!;
        if (!isInputFocused()) {
            inp.focus();
            prevVal.current = inp.value;
            const nValue = isVkEvent(event) ? inp.value.slice(0, -1) : inp.value;
            sRef.current = nValue.length;
            handleChange({ target: { ...HEADERS_CHANGE, value: nValue } });
        }
        else if (isVkEvent(event)) {
            let nValue = inp.value;
            const value1 = nValue.substring(0, inp.selectionStart! - 1);
            const value2 = nValue.substring(inp.selectionEnd!);
            nValue = value1 + value2;
            sRef.current = inp.selectionStart! - 1;
            handleChange({ target: { ...HEADERS_CHANGE, value: nValue } });
        }
    }

    function onEnter(event: React.KeyboardEvent<HTMLInputElement> | CustomEvent<VkDetail>) {
        const inp = inputRef.current!;
        if (isVkEvent(event) || isInputFocused()) {
            const markerButton = mButtonEnter;
            const win = (event.target as HTMLElement).ownerDocument.defaultView!;
            let cEvent: CustomEvent | undefined;
            if (markerButton) {
                cEvent = new win.CustomEvent("cEnter", { bubbles: true, detail: markerButton });
                if (onBlur) onBlur();
                else onChange?.({ target: { ...HEADERS_CHANGE, value: inp.value } });
            }
            else if (!lockedFocus) {
                cEvent = new win.CustomEvent("cTab", { bubbles: true });
            }
            cEvent && inp.dispatchEvent(cEvent);
        }
        else {
            inp.focus();
            prevVal.current = inp.value;
            inp.selectionEnd = inp.value.length;
            inp.selectionStart = inp.value.length;
        }
        event.stopPropagation();
    }

    function onClear() {
        const inp = inputRef.current!;
        inp.value = "";
        if (onChange) onChange({ target: { ...HEADERS_CHANGE, value: inp.value }, inp });
        if (!isInputFocused()) onBlur?.();  // TODO: code smell
    }

    function onCPaste(e: CustomEvent) {
        if (!isInputFocused()) {
            const inp = inputRef.current;
            inp?.focus();
            inp?.setSelectionRange(0, inp.value.length);
        }
        e.stopPropagation();
    }

    function onCopy(event: CustomEvent) {
        if (!isInputFocused()) {
            const inp = inputRef.current;
            inp?.focus();
            inp?.setSelectionRange(0, inp.value.length);
            execCopy(inp);
        }
        event.stopPropagation();
    }

    function onCut(event: CustomEvent) {
        if (!isInputFocused()) {
            const inp = inputRef.current;
            if (!inp) return;
            inp.focus();
            inp.setSelectionRange(0, inp.value.length);
            execCut(inp);
            inp.blur();
        }
        event.stopPropagation();
    }

    useLayoutEffect(() => {
        if (kRef.current !== null) {
            inputRef.current!.selectionStart = kRef.current;
            inputRef.current!.selectionEnd = kRef.current;
            kRef.current = null;
        }
    });

    useAddEventListener(inputRef, 'beforeinput', onBeforeInput);
    useAddEventListener<CustomEvent>(inputRef, 'enter', onEnter);
    useAddEventListener(inputRef, 'delete', onDelete);
    useAddEventListener(inputRef, 'erase', onClear);
    useAddEventListener(inputRef, 'clear', onClear);
    useAddEventListener(inputRef, 'backspace', onBackspace);
    useAddEventListener(inputRef, 'cpaste', onCPaste);
    useAddEventListener(inputRef, 'ccopy', onCopy);
    useAddEventListener(inputRef, 'ccut', onCut);

    return $(React.Fragment, null,
        before && getDecoratedElem(before),
        $((inputType || 'input'), {
            value, name, readOnly, placeholder,
            ref: mergeRefs(inputRef, _ref),
            size: inputSize,
            style: {
                ...alignRight && { textAlign: "end" },
                ...decorators && { width: `${clamp((value ?? '').length + 1.5, 0, 15)}ch` }
            },
            type: type || "text",
            rows: rows || '2',
            ...uctext && { className: "uppercase" },
            ...haveVk && { inputMode: 'none' },
            ...name && { autoComplete: "new-password" },
            "data-type": dataType,   // VK reads it
            "data-changing": changing,  // for tests
            onChange: handleChange,
            onKeyDown: handleKeyDown,
            onBlur: handleBlur, onFocus,
            onClick
        }),
        after && getDecoratedElem(after)
    );
}

function validateInput(inputStr?: string, regexStr?: string, skipInvalidSymbols?: boolean, upperCase?: boolean): string {
    if (!inputStr) return '';
    const casedStr = upperCase ? inputStr.toUpperCase() : inputStr;
    if (!regexStr) return casedStr;
    const regex = new RegExp(skipInvalidSymbols ? regexStr : `^${regexStr}*$`, 'g');
    const validatedStr = casedStr.match(regex)?.join('');
    return validatedStr || '';
}

function isVkEvent(event: React.KeyboardEvent | CustomEvent): boolean {
    const detail = (event as CustomEvent<VkDetail>).detail;
    return !!(detail && typeof detail === "object" && detail.vk);
}


interface InputElementProps extends InputElementBaseProps {
    path: string
    className?: string
    children?: React.ReactNode
    buttonElement?: React.ReactNode
}

const InputElement = ({
    className, path, children,
    buttonElement,
    alignRight, ...props
}: InputElementProps): React.ReactElement => {
    const { focusClass, focusHtml } = useFocusControl(path);
    const readOnly = !props.onChange && !props.onBlur;

    const sideContent = Array.isArray(children)
        ? (children as React.ReactElement[]).filter(c => c.props.className?.split(' ').includes("sideContent"))
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

export type { InputChangeEvent }
export { InputElement, InputElementBase }