import React, { createElement as $, useState, useContext, useCallback } from 'react'
import { createPortal } from 'react-dom';
import clsx from 'clsx'
import { ButtonInputElement } from './button-input-element'
import { ImageElement } from '../main/image'
import { InputElementBase } from './input-element'
import { useFocusControl } from './focus-control'
import { ARROW_DOWN_SVG } from './arrow-down-svg';
import { usePopupPos } from "../main/popup";
import { PopupDrawerContext } from './popup-elements/popup-contexts';

function DropDownElement({ open, onClick, path, className, ...props }) {
    function onChange(e) {
        props.onChange?.({target:{headers:{"x-r-action":"change"},value:e.target.value}});
    }

    function onKeyDown(e) {
        let call = "";
        let opt = null;
        switch(e.key) {
            case "ArrowDown":
            case "ArrowUp":
                e.stopPropagation();
                e.preventDefault();
                if(!open) return onClick();
                else call = e.key;
                break;
            case "Enter":
                if (open) {
                    call = e.key;
                    e.preventDefault();
                    props.onBlur?.();
                }
                break;
            case "Backspace":
                if (props.changing !== '1' && e.target.value.length == 0)
                    call = e.key;
                break;
            case "Escape":
                call = e.key;
                e.preventDefault();
                break;
        }
        if (call.length > 0) props.onClickValue?.("key", call, opt);
        return true;    // bail out of InputElementBase keydown handling
    }

    const getChildrenByClass = (cl) => {
        if(!Array.isArray(props.children)) return;
        return props.children.filter(c=>c.props.at?c.props.at.className.split(' ').includes(cl):c.props.className.split(' ').includes(cl))
    }

    const { focusClass, focusHtml } = useFocusControl(path);
    const readOnly = !props.onChange && !props.onBlur;

    const sideContent = getChildrenByClass('sideContent');
    const chosenOptions = getChildrenByClass("input");
    const popupChildren = getChildrenByClass("popup");

    const isMultiDropdown = chosenOptions?.length > 0;

    const inputBase = $(InputElementBase, { ...props, lockedFocus: open, onChange, onKeyDown });

    return $("div", {
        className: clsx("inputBox", focusClass, className),
        style: readOnly ? { borderColor: 'transparent' } : undefined,
        ...focusHtml
    },
        isMultiDropdown
            ? $("div", {
                  className: clsx("mddBox", !open && 'shortMddBox'),
                  onMouseDown: (e) => e.target.tagName !== "INPUT" && e.preventDefault()
              }, chosenOptions, inputBase)
            : inputBase,
        $(ButtonInputElement, { rotate: open, onClick }, props.url
            ? $(ImageElement, { src: props.url }) : ARROW_DOWN_SVG),
        sideContent,
        $(DropDownPopup, { open, popupChildren, onBlur: props.onBlur })
    );
}

// Special popup outside PopupManager due to backend rely on FocusAnnouncer receiver to manage popup and DD state in one transaction
function DropDownPopup({ open, popupChildren, onBlur }) {
    const [popupEl, setPopupEl] = useState(null);

    const [parent, setParent] = useState(null);
    const setPopupParent = useCallback((elem) => setParent(elem && elem.parentElement), []);

    const [popupStyle] = usePopupPos(popupEl, false, parent);

    const popupDrawer = useContext(PopupDrawerContext);

    const onMouseDown = (e) => {
        e.preventDefault();
        onBlur?.();
    };

    const popup = $("div", { style: popupStyle, className: "popup popupEl", ref: setPopupEl, onMouseDown }, popupChildren)

    return open && popupDrawer
        ? $(React.Fragment, null,
            createPortal(popup, popupDrawer),
            $('span', {ref: setPopupParent, style: { display: 'none' }}))
        : null;
}

export default DropDownElement