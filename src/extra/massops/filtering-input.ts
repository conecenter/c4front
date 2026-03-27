import { createElement as $ } from 'react';
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

    const searchIcon = () => $(SVGElement, { url: SearchSvg, className: 'searchIcon' });

    return $(InputElement, {
        value: filterValue,
        path: `${path}/:filter`,
        className: 'filteringInput',
        onChange,
        buttonElement: searchIcon
    });
}

export type { InputChangeEvent }
export { FilteringInput }