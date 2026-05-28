import { createElement as $ } from 'react'
import clsx from 'clsx'
import { ButtonElement } from './button-element'

export const ButtonInputElement = (props) => (
    $("div", { className: clsx("buttonEl", props.rotate && 'rotate') },
        $(ButtonElement, { ...props }))
);