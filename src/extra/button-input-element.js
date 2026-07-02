import { createElement as $ } from 'react'
import clsx from 'clsx'
import { ButtonElement } from './button-element'

export const ButtonInputElement = ({ rotate, ...props }) => (
    $(ButtonElement, { ...props, className: clsx("buttonEl", rotate && 'rotate') })
);