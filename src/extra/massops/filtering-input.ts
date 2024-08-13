import { createElement as $, ReactElement, useEffect, useRef } from 'react';
import { InputElement } from '../input-element';
import { SVGElement } from '../../main/image';
import SearchSvg from './search.svg';

interface InputChangeEvent {
    target: {
        value: string,
        headers: { "x-r-action": "change" }
    }
}

interface FilteringInput {
    filterValue: string,
    path: string,
    sendChange: (change: string) => void
}

function FilteringInput({ filterValue, path, sendChange }: FilteringInput) {
    const onChange = (e: InputChangeEvent) => sendChange(e.target.value);

    const inputRef = useRef<(ReactElement & { inp: HTMLInputElement }) | null>(null);
    useEffect(function focusInputOnRender() {
        setTimeout(() => inputRef.current?.inp?.focus());
    }, []);

    const searchIcon = () => $(SVGElement, { url: SearchSvg, className: 'searchIcon' });

    return $(InputElement, {
        _ref: inputRef,
        value: filterValue,
        path: `${path}/:filter`,
        className: 'filteringInput',
        onChange,
        buttonElement: searchIcon
    });
}

export type { InputChangeEvent }
export { FilteringInput }