import React, { cloneElement, createContext, MutableRefObject, ReactElement, useMemo } from "react";
import { ButtonElement } from "../button-element";
import { NoCaptionContext, usePath } from "../../main/vdom-hooks";
import { ImageElement } from "../../main/image";
import { ColorDef } from "../view-builder/common-api";
import { usePopupState } from "../popup-elements/popup-manager";
import { PopupElement } from "../popup-elements/popup-element";
import { FilteringInput } from "./filtering-input";
import { MassOp } from "./filter-massop";
import { useLatest } from "../custom-hooks";
import { Patch, usePatchSync } from '../exchange/patch-sync';

const FilterButtonExpanderContext = createContext<MutableRefObject<() => void> | null>(null);
FilterButtonExpanderContext.displayName = 'FilterButtonExpanderContext';

const FILTER_INPUT_RECEIVER = 'filterInput';
const FOLDER_PATH_DIVIDER = '>';

const changeToPatch = (ch: string): Patch => ({ value: ch });
const patchToChange = (p: Patch) => p.value;
const applyChange = (prev: string, ch: string) => ch;

interface FilterButtonExpander {
    identity: object,
    area: string,
    name?: string,
    color?: ColorDef,
    filterValue?: string,
    optButtons: ReactElement[]
}

function FilterButtonExpander({ identity, name, color, optButtons = [], filterValue: sFilterValue = '' }: FilterButtonExpander) {
    const path = usePath(identity);

    const { isOpened, toggle } = usePopupState(path);

    const closeExpanderRef = useLatest(() => toggle(false));

    const { currentState: filterValue, sendTempChange } = usePatchSync(
        identity, FILTER_INPUT_RECEIVER, sFilterValue, false, s => s, changeToPatch, patchToChange, applyChange
    );

    const showFilter = countMassOps(optButtons) > 5;
    const massOps = useMemo(
        () =>  showFilter && filterValue ? filterMassOps(optButtons) : optButtons,
        [filterValue, optButtons]
    );

    function filterMassOps(massOps: ReactElement[] = [], folderPath: string = ''): ReactElement<MassOp>[] {
        return massOps.reduce((accum: ReactElement<MassOp>[], massOp) => {
            if (isMassOpType(massOp)) {
                const { isFolder, name, nameFolded } = massOp.props;
                const massOpPath = (folderPath ? folderPath + ` ${FOLDER_PATH_DIVIDER} ` : '') + (nameFolded || name);
                if (isFolder) return [...accum, ...filterMassOps(massOp.props.children, massOpPath)];
                if (isMassOpFiltered(massOpPath, filterValue!)) {
                    const massOpWithPath = cloneElement(massOp, { folderPath });
                    return [...accum, massOpWithPath];
                }
            }
            return accum;
        }, []);
    }

    return (
        <ButtonElement value='' path={path} className='filterButtonExpander' color={color} onClick={() => toggle(!isOpened)} >
            {!name && <ImageElement src='/mod/main/ee/cone/core/ui/c4view/burger.svg' className='textLineSize' color='adaptive' />}
            {name}
            {isOpened &&
                <PopupElement popupKey={path}>
                    <FilterButtonExpanderContext.Provider value={closeExpanderRef}>
                        <NoCaptionContext.Provider value={true}>
                            {showFilter &&
                                <FilteringInput filterValue={filterValue} sendChange={sendTempChange} path={path} />}
                            {massOps}
                        </NoCaptionContext.Provider>
                    </FilterButtonExpanderContext.Provider>
                </PopupElement>}
        </ButtonElement>
    );
}

function isMassOpType(elem: ReactElement): elem is ReactElement<MassOp> {
    return elem.type === MassOp;
}

function isMassOpFiltered(massOpPath: string, filterValue: string) {
    const pathWithoutDividers = massOpPath.replaceAll(`${FOLDER_PATH_DIVIDER} `, '');
    return pathWithoutDividers.toLowerCase().includes(filterValue!.toLowerCase());
}

function countMassOps(elems: ReactElement[] = []) {
    let count = 0;
    for (const elem of elems) {
        if (isMassOpType(elem)) {
            count = elem.props.isFolder ? count + countMassOps(elem.props.children) : count + 1;
        }
    }
    return count;
}

export { FilterButtonExpander, FilterButtonExpanderContext }