import {RefObject, useLayoutEffect, useState} from "react";

interface SelectionState {
    needsSet: boolean,
    startPosition: number,
    endPosition: number
}

const initialSelectionState: SelectionState = {
    needsSet: false,
    startPosition: 0,
    endPosition: 0,
}

export function useSelectionEditableInput(inputElement: RefObject<HTMLInputElement>): (from: number, to: number) => void {
    const [selectionState, setSelectionState] = useState<SelectionState>(initialSelectionState)
    const setSelection = (from: number, to: number): void => {
        setSelectionState((state: SelectionState) => ({...state, needsSet: true, startPosition: from, endPosition: to}))
    }
    useLayoutEffect(() => {
        if (inputElement.current && selectionState.needsSet) {
            const current = inputElement.current
            const {selectionStart, selectionEnd} = current;
            const update = selectionState.startPosition !== selectionStart || selectionState.endPosition !== selectionEnd;
            if (update) {
                current.selectionStart = selectionState.startPosition;
                current.selectionEnd = selectionState.endPosition;
                setSelectionState((state: SelectionState) => ({...state, needsSet: false}))
            }
        }
    }, [selectionState])
    return setSelection
}