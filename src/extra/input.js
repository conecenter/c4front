import React, { createElement as $ } from 'react'
import clsx from 'clsx'
import { Focusable } from 'c4f/extra/focus-control.ts'
import StatefulComponent from '../../../../extra/stateful-component'
import { checkActivateCalls, eventManager } from '../../../../extra/utils.js'
import { dragDropModule } from "../../../../extra/dragdrop-module"
import folderImg from "../../../../extra/media/images/folder.svg"
import crossImg from "../../../../extra/media/images/close.svg"

import { ButtonElement } from 'c4f/extra/button-element'
import { NoCaptionContext } from "c4f/main/vdom-hooks.js";
import { InputsSizeContext } from "c4f/extra/dom-utils";
import { VkInfoContext } from 'c4f/extra/ui-info-provider';


const activeElement = (e) => e&&e.ownerDocument.activeElement
const execCopy = (e) =>  e&&e.ownerDocument.execCommand('copy')
const execCut = (e) =>  e&&e.ownerDocument.execCommand('cut')
const fileReader = (e)=> e&&(new e.ownerDocument.defaultView.FileReader())

const ReControlledInput = "input"

const ButtonInputElement = (props) => (
    $("div", { key: "inputButton", className: "buttonEl" },
        $(ButtonElement, { ...props, className: "inputButtonElement" }))
);

const validateInput = (inputStr, regexStr, skipInvalidSymbols, upperCase) => {
    if (!inputStr) return '';
    const casedStr = upperCase ? inputStr.toUpperCase() : inputStr;
    if (!regexStr) return casedStr;
    const regex = new RegExp(skipInvalidSymbols ? regexStr : `^${regexStr}*$`, 'g');
    const validatedStr = casedStr.match(regex)?.join('');
    return validatedStr || '';
}

class InputElementBase extends StatefulComponent {
    getInitialState(){return {visibility:""}}
    setFocus(focus){
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
            let cEvent
            if (markerButton) {
                cEvent = eventManager.create(event.target)("cEnter", { bubbles: true, detail: markerButton })
                if (this.props.onBlur) this.props.onBlur()
                else this.props.onChange?.({ target: { headers: { "x-r-action": "change" }, value: this.inp.value } })
            }
            else if (!this.props.lockedFocus) {
                cEvent = eventManager.create(event.target)("cTab", { bubbles: true })
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
        this.props.onChange({ target: { headers: { "x-r-action": "change" }, value }, inp: e.inp });
    }
    onBlur() {
        this.props.onBlur?.();
        this.prevval = this.inp.value
    }
    onMouseDown(e) {
        if (!this.props.div) return
        if (!this.props.onReorder) return
        this.dragBinding = dragDropModule.dragStartDD(e, this.inp, this.onMouseUpCall)
        if (this.dragBinding) this.setState({ visibility: "hidden" })
    }
    onMouseUpCall(newPos) {
        if (!this.props.div) return
        if (!this.props.onReorder) return
        this.setState({ visibility: "" })
        this.props.onReorder("reorder", newPos.toString())
    }
    render() {
        const readOnly = !this.props.onChange && !this.props.onBlur
        const inpContStyle = readOnly ? {borderColor: "transparent"} : undefined;
        const {focusClass, focusHtml} = this.props.focusProps || {};
        const inputClassName = this.props.inputType && this.props.inputType !== "textarea" ? "roInputBox" : "inputBox"
        const inputType = !this.props.inputType ? ReControlledInput : this.props.inputType
        const name = this.props.typeKey || null
        const content = this.props.content

        const errorChildren = this.getChildrenByClass("sideContent")
        const errors = errorChildren && errorChildren.length > 0 ? errorChildren : []
        const alignRight = !!this.props.alignRight
        const inputStyle = alignRight ? {textAlign: "end"} : undefined
        const errorsRight = alignRight ? [] : errors
        const errorsLeft = !alignRight ? [] : errors
        return $("div", { style: inpContStyle, ref: (ref) => this.cont = ref, className: clsx(inputClassName, focusClass), ...focusHtml }, [
            this.props.shadowElement ? this.props.shadowElement() : null,
            ...errorsLeft,
            $(InputsSizeContext.Consumer, null, size => this.props.drawFunc(
                $(inputType, {
                    key: "input",
                    ref: ref => this.inp = ref,
                    name, content, size, readOnly,
                    style: inputStyle,
                    type: this.props.type,
                    value: this.props.value,
                    rows: this.props.rows,
                    placeholder: this.props.placeholder,
                    ...this.props.uctext && {className: "uppercase"},
                    ...this.context.haveVk && {inputMode: 'none'},
                    ...name && {autoComplete: "new-password"},
                    "data-type": this.props.dataType,
                    "data-changing": this.props.changing,
                    onChange: this.onChange, onBlur: this.onBlur, onFocus: this.props.onFocus,
                    onKeyDown: this.onKeyDown, onMouseDown: this.onMouseDown, onTouchStart: this.onMouseDown
                },
                    content ? content : null)
                )
            ),
            this.props.uploadedFileElement ? this.props.uploadedFileElement() : null,
            this.props.deleteButtonElement ? this.props.deleteButtonElement() : null,
            this.props.buttonElement ? this.props.buttonElement() : null,
            ...errorsRight,
            this.props.popupElement ? this.props.popupElement() : null
        ]);
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


const InputWithButtonElement = (props) => {
    const { imgUrl, value, inputStyle, onBlur, onClick } = props
    const buttonImageStyle = {
        verticalAlign: "middle",
        display: "inline",
        //height: "100%",
        //width: "100%",
        transform: props.open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "all 200ms ease",
        boxSizing: "border-box",
        ...props.buttonImageStyle
    }
    const buttonImage = $("img", { key: "buttonImg", src: imgUrl, style: buttonImageStyle, className: props.className }, null)
    const buttonElement = () => [$(ButtonInputElement, { key: "buttonEl", onClick }, buttonImage)]
    const drawFunc = _ => _
    const onChange = e => {
        if (onChange) props.onChange({ target: { headers: { "x-r-action": "change" }, value: e.target.value } })
    }
    return $(InputElement, { ...props, drawFunc, inputStyle, value, buttonElement, onChange, onBlur })
}

const TextAreaElement = (props) => {
    const inputStyle = {
        whiteSpace: "pre-wrap",
        resize: "none",
        ...props.inputStyle
    }
    const onKeyDown = evt => {
        if (evt.target.ownerDocument.activeElement.tagName == "TEXTAREA") {
            switch (evt.keyCode) {
                case 9:
                    break
                default:
                    evt.stopPropagation()
            }
        }
        return false
    }
    return $(InputElementBase, { ...props, onKeyDown, ref: props._ref, inputType: "textarea", inputStyle })
}

const LabeledTextElement = (props) => $(InputElementBase, {
    ...props,
    onKeyDown: () => false,
    inputType: "div",
    inputStyle: {
        ...props.inputStyle,
        display: "inline-block"
    },
    style: {
        ...props.style,
        backgroundColor: "transparent",
        borderColor: "transparent",
        lineHeight: "normal"
    },
    content: props.value
})
class MultilineTextElement extends StatefulComponent {
    getInitialState() { return { maxItems: 0 } }
    getMaxItems() {
        const maxLines = parseInt(this.props.maxLines ? this.props.maxLines : 9999)
        let line = 0
        let bottomValue = 0
        const maxItems = Array.from(this.el.children).filter(c => {
            const cBottom = Math.floor(c.getBoundingClientRect().bottom)
            if (cBottom > bottomValue) { line++; bottomValue = cBottom }
            if (line > maxLines) return false
            return true
        })
        return maxItems.length
    }
    check() {
        const maxItems = this.getMaxItems()
        if (maxItems != this.state.maxItems) this.setState({ maxItems })
    }
    componentDidMount() {
        checkActivateCalls.add(this.check)
    }
    componentWillUnmount() {
        checkActivateCalls.remove(this.check)
    }
    render() {
        const values = this.props.value ? this.props.value.split(' ') : ""
        const textStyle = (show) => ({
            display: "inline-block",
            marginRight: "0.5em",
            minHeight: "1em",
            visibility: !show ? "hidden" : ""
        })
        const children = values.map((text, index) => $('span', { key: index, style: textStyle(index < this.state.maxItems) }, (index + 1 == this.state.maxItems && values.length > index + 1) ? text + "..." : text))

        return $('div', { style: this.props.styles, ref: ref => this.el = ref }, children)
    }
}
const FileUploadElement = (props) => {
    const elem = React.useRef(null)
    const [state, setState] = React.useState({})

    const onClick = e => {
        if (elem.current)
            elem.current.click()
    }
    const _arrayBufferToBase64 = (buffer, btoa) => {
        let binary = ''
        let bytes = new Uint8Array(buffer)
        const len = bytes.byteLength
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        return btoa(binary)
    }
    const onChange = e => {
        if (state.reading) return
        const reader = fileReader(e.target)
        const file = e.target.files[0];
        const btoa = e.target.ownerDocument.defaultView.btoa
        reader.onload = (event) => {
            if (props.onReadySendBlob) {
                const blob64 = _arrayBufferToBase64(event.target.result, btoa)
                props.onReadySendBlob(elem.current.value, blob64)
            }
            setState({ reading: false })
        }
        reader.onprogress = () => setState({ reading: true })
        reader.onerror = () => setState({ reading: false })

        reader.readAsArrayBuffer(file)
    }
    const style = {
        backgroundColor: (props.onReadySendBlob && !state.reading) ? "white" : "#eeeeee",
        ...props.style
    }
    const buttonImageStyle = {
        verticalAlign: "middle",
        display: "inline",
        boxSizing: "border-box"
    }
    const uploadedFileImg = props.file
    const urlData = props.url ? props.url : folderImg;
    const buttonImage = $("img", { key: "buttonImg", src: urlData, style: buttonImageStyle }, null);
    const deleteButtonImage = $("img", { key: "delButtonImg", src: crossImg, style: buttonImageStyle }, null);
    const uploadedFileImage = $("img", { key: "uploadedFileImg", src: uploadedFileImg, style: buttonImageStyle }, null);
    //const placeholder = props.placeholder?props.placeholder:"";
    const shadowElement = () => [$("input", { key: "0", ref: elem, onChange, type: "file", style: { visibility: "hidden", position: "absolute", height: "1px", width: "1px" } }, null)]
    const buttonElement = () => [$(ButtonInputElement, { key: "2", onClick }, buttonImage)]
    const deleteButtonElement = () => props.onDelete && uploadedFileImg ? [$(ButtonInputElement, { key: "3", onClick: e => props.onDelete() }, deleteButtonImage)] : []
    const windowOpenAction = (e) => {
        // window.location.replace(uploadedFileImg)
        let win = window.open();
        win.document.write('<img src="' + uploadedFileImg + '" ></img>');
    }
    const uploadedFileElement = () =>
        uploadedFileImg ? [$(ButtonInputElement, { key: "uploadedFileElement", className: "uploadedFileElement", onClick: windowOpenAction }, uploadedFileImage)] : []

    return $(InputElement, { ...props, style, shadowElement, uploadedFileElement, deleteButtonElement, buttonElement, onChange: () => { }, onClick: () => { } })
}
const FileUploadElement2 = (props) => {
    const elem = React.useRef(null)
    const [state, setState] = React.useState({})

    const onClick = e => {
        if (elem.current)
            elem.current.click()
    }
    const onChange = e => {
        if (state.reading) return
        const promise = new Promise((resolve, reject) => {
            const reader = fileReader(e.target)
            const file = e.target.files[0];
            reader.onload = (event) => {
                const bytes = new Uint8Array(event.target.result)
                const filename = file.name.split('/').reverse()[0]
                resolve({ filename, bytes })
            }
            reader.onprogress = () => setState({ reading: true })
            reader.onerror = () => reject()
            reader.readAsArrayBuffer(file)
        })
        const w = e.target.ownerDocument.defaultView
        promise
            .then(({ filename, bytes }) => w.fetch(props.putUrl, { method: "PUT", body: bytes, headers: { "file-name": filename } }))
            .then(response => { if (response.status != 200) throw new Error(`${response.url} | ${response.status}`); return response.text() })
            .then(body => { if (props.onChange) props.onChange({ target: { headers: { "x-r-action": "change" }, value: body } }) })
            .finally(() => setState({ reading: false }))
    }
    const style = {
        backgroundColor: (props.onChange && !state.reading) ? "white" : "#eeeeee",
        ...props.style
    }
    const buttonImageStyle = {
        verticalAlign: "middle",
        display: "inline",
        height: "auto",
        boxSizing: "border-box"
    }
    const urlData = props.url ? props.url : folderImg;
    const buttonImage = $("img", { key: "buttonImg", src: urlData, style: buttonImageStyle }, null);
    //const placeholder = props.placeholder?props.placeholder:"";
    const shadowElement = () => [$("input", { key: "0", ref: elem, onChange, type: "file", style: { visibility: "hidden", position: "absolute", height: "1px", width: "1px" } }, null)]
    const buttonElement = () => [$(ButtonInputElement, { key: "2", onClick }, buttonImage)]
    let value
    try {
        value = JSON.parse(props.value).fileName
    } catch (e) {
        value = props.value
    }

    return $(InputElement, { ...props, value, style, shadowElement, buttonElement, onChange: () => { }, onClick: () => { } })
}
const LabelElement = ({ style, onClick, label, children }) => (
    React.useContext(NoCaptionContext) ?
        $("label", ...(children ? children : [])) :
        $("label", {
            onClick, style: {
                cursor: onClick ? "pointer" : "inherit",
                textTransform: "none",
                ...style
            }
        }, [label ? label : null, ...(children ? children : [])])
)

export {
    InputElement, InputWithButtonElement, TextAreaElement,
    LabeledTextElement, MultilineTextElement, ButtonInputElement,
    FileUploadElement, FileUploadElement2, LabelElement
}