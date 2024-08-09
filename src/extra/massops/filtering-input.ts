import { createElement as $ } from 'react';
import { InputElement } from '../input-element';
import { Patch, usePatchSync } from '../exchange/patch-sync';
import { SVGElement } from '../../main/image';
import SearchSvg from './search.svg';

interface FilteringInput {
    identity: object,
    filterValue?: string,
    path: string
}

interface InputChangeEvent {
    target: {
        value: string,
        headers: { "x-r-action": "change" }
    }
}

const FILTER_INPUT_RECEIVER = 'filterInput';

const changeToPatch = (ch: string): Patch => ({ value: ch });
const patchToChange = (p: Patch) => p.value;
const applyChange = (prev: string, ch: string) => ch;

function FilteringInput({ identity, filterValue: sFilterValue = '', path }: FilteringInput) {
    const { currentState: filterValue, sendTempChange } = usePatchSync(
        identity, FILTER_INPUT_RECEIVER, sFilterValue, false, s => s, changeToPatch, patchToChange, applyChange
    );
    const onChange = (e: InputChangeEvent) => sendTempChange(e.target.value);

    const searchIcon = () => $(SVGElement, { url: SearchSvg, className: 'searchIcon' });

    return $(InputElement, {
        value: filterValue,
        path: `${path}/:${FILTER_INPUT_RECEIVER}`,
        className: 'filteringInput',
        onChange,
        buttonElement: searchIcon
    });
}

export { FilteringInput }