import {MutableRefObject, useLayoutEffect, useState} from "react";

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

export function useSelectionEditableInput(inputRef: MutableRefObject<HTMLInputElement | null>): (from: number, to: number) => void {
    const [selectionState, setSelectionState] = useState<SelectionState>(initialSelectionState)
    const setSelection = (from: number, to: number): void => {
        setSelectionState((state: SelectionState) => ({...state, needsSet: true, startPosition: from, endPosition: to}))
    }
    useLayoutEffect(() => {
        if (inputRef.current && selectionState.needsSet) {
            const current = inputRef.current
            const {selectionStart, selectionEnd} = current;
            const update = selectionState.startPosition !== selectionStart || selectionState.endPosition !== selectionEnd;
            if (update) {
                current.selectionStart = selectionState.startPosition;
                current.selectionEnd = selectionState.endPosition;
                setSelectionState((state: SelectionState) => ({...state, needsSet: false}))
            }
        }
    }, [selectionState, inputRef.current])
    return setSelection
}