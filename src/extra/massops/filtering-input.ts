import { createElement as $ } from 'react';
import { InputChangeEvent, InputElement } from '../input-element';
import { SVGElement } from '../../main/image';
import SearchSvg from './search.svg';

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

export { FilteringInput }