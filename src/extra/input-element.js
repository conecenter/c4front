import React, { createElement as $ } from 'react';
import autoBind from 'react-autobind';
import clsx from 'clsx';
import { Focusable } from './focus-control';
import { InputsSizeContext } from "./dom-utils";
import { VkInfoContext } from './ui-info-provider';

const HEADERS_CHANGE = { headers: { "x-r-action": "change" } };

class StatefulComponent extends React.Component {
	constructor(props) {
	  super(props)
	  this.state = this.getInitialState?.() || {}
	  autoBind(this)
	}
}

const activeElement = (e) => e&&e.ownerDocument.activeElement
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

class InputElementBase extends StatefulComponent {
    getInitialState() {
        return { isFocused: false };
    }
    setFocus(focus) {
        if(!focus) return
        this.inp.focus()
    }
    onKeyDown(e) {
        if(!this.inp) return;
        if (this.props.onKeyDown?.(e)) return;
        switch (e.key) {
            case "Escape":
                if (this.prevval != undefined && this.inp.value !== this.prevval) {
                    this.onChange?.({ target: { value: this.prevval } });
                }
                this.cont.focus();
                e.stopPropagation();
                break;
            case "Enter":
                e.preventDefault();
                this.onEnter(e);
                // fall through
            case "Tab":
            case "F2":
                break;
            default:
                // Stop propagation from focused input to FocusModule - avoid extra work
                e.stopPropagation();
        }
    }
    doIfNotFocused(what) {
        if (this.inp != activeElement(this.inp)) {
            this.setFocus(true)
            what(this.inp)
            return true
        }
        return false
    }
    isVkEvent(event) {
        return event.detail && typeof event.detail == "object" ? event.detail.vk : false
    }
    onEnter(event) {
        if (this.isVkEvent(event) || !this.doIfNotFocused(inp => {
            this.prevval = inp.value
            inp.selectionEnd = inp.value.length
            inp.selectionStart = inp.value.length
        })) {
            const markerButton = this.props.mButtonEnter
            const window = event.target.ownerDocument.defaultView
            let cEvent
            if (markerButton) {
                cEvent = new window.CustomEvent("cEnter", { bubbles: true, detail: markerButton })
                if (this.props.onBlur) this.props.onBlur()
                else this.props.onChange?.({ target: { headers: { "x-r-action": "change" }, value: this.inp.value } })
            }
            else if (!this.props.lockedFocus) {
                cEvent = new window.CustomEvent("cTab", { bubbles: true })
            }
            cEvent && this.cont.dispatchEvent(cEvent)
        }
        event.stopPropagation()
    }
    onDelete(event){
        event.stopPropagation()
        this.s = null
        const { inputRegex, uctext, skipInvalidSymbols } = this.props;
        if (!this.doIfNotFocused(inp => {
            this.prevval = inp.value
            let nValue;
            if (this.isVkEvent(event)) {
                const validatedStr = validateInput(event.detail?.key, inputRegex, skipInvalidSymbols, uctext);
                nValue = validatedStr
                this.s = validatedStr.length
            } else nValue = ""
            this.onChange({ target: { headers: { "x-r-action": "change" }, value: nValue } }, inp)
        })) {
            if (this.isVkEvent(event)) {
                const validatedStr = validateInput(event.detail?.key, inputRegex, skipInvalidSymbols, uctext);
                let nValue = this.inp.value
                if (!event.detail.key) {    // delete key case
                    const newSelectionStart = this.inp.selectionStart === this.inp.selectionEnd
                        ? this.inp.selectionStart - 1
                        : this.inp.selectionStart
                    nValue = nValue.substring(0, newSelectionStart) + nValue.substring(this.inp.selectionEnd)
                    this.s = newSelectionStart < 0 ? 0 : newSelectionStart
                } else {
                    const value1 = nValue.substring(0, this.inp.selectionStart)
                    const value2 = nValue.substring(this.inp.selectionEnd)
                    nValue = value1 + validatedStr + value2
                    this.s = this.inp.selectionStart + 1
                }
                this.onChange({ target: { headers: { "x-r-action": "change" }, value: nValue }, inp: this.inp })
            }
        }
    }
    onClear(){
        this.inp.value = ""
        if (this.props.onChange) this.props.onChange({ target: { headers: { "x-r-action": "change" }, value: this.inp.value }, inp: this.inp })
        if (this.inp != activeElement(this.inp)) this.props.onBlur?.()
    }
    onErase(){
        this.onClear()
        if (this.props.onBlur) this.props.onBlur()
    }
    onBackspace(event){
        event.stopPropagation()
        if (!this.doIfNotFocused(inp => {
            this.prevval = inp.value
            const nValue = this.isVkEvent(event) ? inp.value.slice(0, -1) : inp.value
            this.s = nValue.length;
            this.onChange({ target: { headers: { "x-r-action": "change" }, value: nValue }, inp })
        })) {
            if (this.isVkEvent(event)) {
                let nValue = this.inp.value
                const value1 = nValue.substring(0, this.inp.selectionStart - 1)
                const value2 = nValue.substring(this.inp.selectionEnd)
                nValue = value1 + value2
                this.s = this.inp.selectionStart - 1
                this.onChange({ target: { headers: { "x-r-action": "change" }, value: nValue }, inp: this.inp })
            }
        }
    }
    onCPaste(e){
        this.doIfNotFocused(inp=>inp.setSelectionRange(0,inp.value.length));
        e.stopPropagation();
    }
    onCopy(event){
        this.doIfNotFocused(inp=>{
            inp.setSelectionRange(0, inp.value.length)
            execCopy(this.inp)
        })
        event.stopPropagation()
    }
    onCut(event){
        this.doIfNotFocused(inp=>{
            inp.setSelectionRange(0,inp.value.length)
            execCut(inp)
            this.inp.blur()
        })
        event.stopPropagation()
    }
    onClick(event){
        const readOnly = (!this.props.onChange && !this.props.onBlur)
        if (!readOnly /*&& !this.props.clickThrough*/) event.stopPropagation()
    }
    onBeforeInput(e) {
        const { inputRegex, uctext, skipInvalidSymbols } = this.props;
        if (e.data && inputRegex) {
            const validatedStr = validateInput(e.data, inputRegex, skipInvalidSymbols, uctext);
            if (validatedStr === e.data) return;
            e.preventDefault();
            if (validatedStr && e.defaultPrevented) this.inp.ownerDocument.execCommand("insertText", false, validatedStr);
        }
    }
    addListeners(inp){
        if(!inp) return
        inp.addEventListener('beforeinput',this.onBeforeInput)
        inp.addEventListener('enter',this.onEnter)
        inp.addEventListener('click',this.onClick)
        inp.addEventListener('delete',this.onDelete)
        inp.addEventListener('erase',this.onErase)
        inp.addEventListener('clear',this.onClear)
        inp.addEventListener('backspace',this.onBackspace)
        inp.addEventListener('cpaste',this.onCPaste)
        inp.addEventListener('ccopy',this.onCopy)
        inp.addEventListener('ccut',this.onCut)
    }
    remListeners(inp){
        if(!inp) return
        inp.removeEventListener('beforeinput',this.onBeforeInput)
        inp.removeEventListener('enter',this.onEnter)
        inp.removeEventListener('click',this.onClick)
        inp.removeEventListener('delete',this.onDelete)
        inp.removeEventListener('erase',this.onErase)
        inp.removeEventListener('clear',this.onClear)
        inp.removeEventListener('backspace',this.onBackspace)
        inp.removeEventListener('cpaste',this.onCPaste)
        inp.removeEventListener('ccopy',this.onCopy)
        inp.removeEventListener('ccut',this.onCut)
    }
    componentDidMount() {
        //this.setFocus(this.props.focus)
        if (this.inp) this.inp.changing = this.props.changing
        this.addListeners(this.inp)
    }
    componentWillUnmount() {
        if (this.dragBinding) this.dragBinding.releaseDD()
        this.remListeners(this.inp)
    }
    componentDidUpdate() {
        if (this.props.cursorPos) {
            const pos = this.props.cursorPos()
            if (pos.ss) this.inp.selectionStart = pos.ss
            if (pos.se) this.inp.selectionEnd = pos.se
        }
        if (this.k !== null && this.k !== undefined) {
            this.inp.selectionStart = this.k
            this.inp.selectionEnd = this.k
            this.k = null
        }
        if (this.inp) this.inp.changing = this.props.changing
    }
    onChange(e) {
        if (!this.props.onChange) return;
        this.k = this.inp.selectionStart;
        if (this.s !== null && this.s !== undefined) { this.k = this.s; this.s = null }
        let value = e.target.value
        if (this.props.uctext) value = value.toUpperCase();
        this.props.onChange({ target: { ...HEADERS_CHANGE, value }, inp: e.inp });
    }
    onFocus(e) {
        this.setState({ isFocused: true });
        this.props.onFocus?.(e);
    }
    onBlur() {
        this.setState({ isFocused: false });
        this.props.onBlur?.({
            target: { ...HEADERS_CHANGE, value: this.inp.value },
            replaceLastPatch: true
        });
        this.prevval = this.inp.value
    }
    render() {
        const readOnly = !this.props.onChange && !this.props.onBlur
        const inpContStyle = readOnly ? {borderColor: "transparent"} : undefined;
        const {focusClass, focusHtml} = this.props.focusProps || {};
        const className = clsx("inputBox", this.props.className, focusClass);
        const inputType = !this.props.inputType ? "input" : this.props.inputType
        const name = this.props.typeKey || null
        const content = this.props.content
        const errorChildren = this.getChildrenByClass("sideContent")
        const errors = errorChildren?.length > 0 ? errorChildren : []
        const alignRight = !!this.props.alignRight
        const value = this.state.isFocused ? this.props.value : this.getDecoratedValue()
        return $("div", { style: inpContStyle, ref: (ref) => this.cont = ref, className, ...focusHtml },
            this.props.shadowElement?.(),
            alignRight && errors,
            $(InputsSizeContext.Consumer, null, size => this.props.drawFunc(
                $(inputType, {
                    key: "input",
                    ref: ref => this.inp = ref,
                    name, content, size, readOnly,
                    style: alignRight ? {textAlign: "end"} : undefined,
                    type: this.props.type,
                    value,
                    rows: this.props.rows,
                    placeholder: this.props.placeholder,
                    ...this.props.uctext && {className: "uppercase"},
                    ...this.context.haveVk && {inputMode: 'none'},
                    ...name && {autoComplete: "new-password"},
                    "data-type": this.props.dataType,
                    "data-changing": this.props.changing,
                    onChange: this.onChange, onKeyDown: this.onKeyDown,
                    onBlur: this.onBlur, onFocus: this.onFocus
                }, content))
            ),
            this.props.uploadedFileElement?.(),
            this.props.deleteButtonElement?.(),
            this.props.buttonElement?.(),
            !alignRight && errors,
            this.props.popupElement?.()
        );
    }
    getDecoratedValue() {
        const { value, decorators } = this.props;
        if (!decorators || !value) return value;
        const { before = '', after = '' } = decorators;
        return `${before}${value}${after}`;
    }
    getChildrenByClass(cl) {
        if (!Array.isArray(this.props.children)) return
        return this.props.children.filter(c => c.props.className.split(' ').includes(cl))
    }
}

InputElementBase.defaultProps = { drawFunc: _ => _, rows: "2", type: "text", placeholder: "" };
InputElementBase.contextType = VkInfoContext;


const InputElement = (props) =>
        $(Focusable, {path: props.path}, focusProps =>
            $(InputElementBase, { ...props, ref: props._ref, focusProps }))


export { InputElement, InputElementBase }