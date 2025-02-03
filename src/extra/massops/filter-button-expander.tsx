import React, { cloneElement, createContext, MutableRefObject, ReactElement, useEffect, useMemo } from "react";
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
import { LabeledElement } from "../labeled-element";
import { identityAt } from "../../main/vdom-util";

const FilterButtonExpanderContext = createContext<MutableRefObject<() => void> | null>(null);
FilterButtonExpanderContext.displayName = 'FilterButtonExpanderContext';

const FOLDER_PATH_DIVIDER = '>';
const EXPANDER_UMID = "grouped-ops";

const filterInputIdOf = identityAt('filterInput');

const serverToState = (s: string) => s;
const changeToPatch = (ch: string): Patch => ({ value: ch });
const patchToChange = (p: Patch) => p.value;
const applyChange = (prev: string, ch: string) => ch;
const patchSyncTransformers = { serverToState, changeToPatch, patchToChange, applyChange };

interface FilterButtonExpander {
    identity: object,
    area: string,
    name?: string,
    icon?: string,
    color?: ColorDef,
    filterValue?: string,
    optButtons: ReactElement[]
}

function FilterButtonExpander({ identity, name, icon, color, optButtons = [], filterValue: sFilterValue = '' }: FilterButtonExpander) {
    const path = usePath(identity);

    const { isOpened, toggle } = usePopupState(path);

    const closeExpanderRef = useLatest(() => toggle(false));

    const { currentState: filterValue, sendTempChange } = usePatchSync(
        filterInputIdOf(identity), sFilterValue, false, patchSyncTransformers
    );

    const showFilter = countMassOps(optButtons) > 5;
    const massOps = useMemo(
        () =>  showFilter && filterValue ? filterMassOps(optButtons) : optButtons,
        [filterValue, optButtons]
    );

    function filterMassOps(massOps: ReactElement[] = [], folderPath: string = ''): ReactElement<MassOp>[] {
        return massOps.reduce((accum: ReactElement<MassOp>[], massOp) => {
            if (isMassOpType(massOp)) {
                const { name, nameFolded, children } = massOp.props;
                const massOpPath = (folderPath ? folderPath + ` ${FOLDER_PATH_DIVIDER} ` : '') + (nameFolded || name);
                if (children) return [...accum, ...filterMassOps(massOp.props.children, massOpPath)];
                if (isMassOpFiltered(massOpPath, filterValue!)) {
                    const massOpWithPath = cloneElement(massOp, { key: `${folderPath + '-'}${massOp.key}`, folderPath });
                    return [...accum, massOpWithPath];
                }
            }
            return accum;
        }, []);
    }

    useEffect(function clearFilterOnPopupClose() {
        if (!isOpened && filterValue) sendTempChange('');
    }, [isOpened]);

    return (
        <LabeledElement umid={EXPANDER_UMID} >
            <ButtonElement
                value=''
                path={path}
                className='filterButtonExpander'
                color={color}
                onClick={() => toggle(!isOpened)}
            >
                {icon && <ImageElement src={icon} className='textLineSize' color='adaptive' />}
                {name && <span className="text">{`${name}...`}</span>}
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
        </LabeledElement>
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
            count = elem.props.children ? count + countMassOps(elem.props.children) : count + 1;
        }
    }
    return count;
}

export { FilterButtonExpander, FilterButtonExpanderContext }