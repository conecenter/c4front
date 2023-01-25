import React, { ReactNode, useMemo, useRef } from "react";
import clsx from "clsx";
import { usePatchSync } from "../exchange/patch-sync";
import { changeToPatch, patchToChange } from "./timepicker-exchange";
import { ARROW_DOWN_KEY, ARROW_UP_KEY, ENTER_KEY, ESCAPE_KEY } from "../../main/keyboard-keys";
import { useSelectionEditableInput } from "../datepicker/selection-control";
import { useUserLocale } from "../locale";
import { getPath, useFocusControl } from "../focus-control";
import {
    createInputChange,
    createTimestampChange,
    parseStringToTime,
    isInputState,
    formatTimestamp,
    getCurrentFMTChar,
    getAdjustedTime,
    MAX_TIMESTAMP
} from "./time-utils";


interface TimePickerProps {
	key: string,
	identity: Object,
	state: TimePickerState,
    offset?: number,
    timestampFormatId: number,
	children?: ReactNode[]
}

type TimePickerState = InputState | TimestampState;

interface InputState {
	tp: 'input-state',
	inputValue: string,
    tempTimestamp?: number
}

interface TimestampState {
	tp: 'timestamp-state',
	timestamp: number
}

function TimePicker({identity, state, offset, timestampFormatId, children}: TimePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const inputBoxRef = useRef<HTMLInputElement>(null);
    const lastFinalState = useRef(state);  // return last final state on Esc

    // Server exchange initialization
    const { currentState, sendTempChange, sendFinalChange: onFinalChange } =
        usePatchSync(identity, 'receiver', state, true, s => s, changeToPatch, patchToChange, (prev, ch) => ch);

    const sendFinalChange = (change: TimePickerState) => {
        lastFinalState.current = change;
        onFinalChange(change);
    }

    // Getting time pattern from locale
    const locale = useUserLocale();
	const timestampFormat = locale.timeFormats.find(format => format.id === timestampFormatId);
    const pattern = timestampFormat?.pattern || 'hh:mm';

    // Get formatted input value
    const inputValue = isInputState(currentState) 
        ? currentState.inputValue : formatTimestamp(currentState.timestamp, pattern, offset);
    
    // Focus functionality
    const path = useMemo(() => getPath(identity), [identity]);
    const { focusClass, focusHtml } = useFocusControl(path);

    const setSelection = useSelectionEditableInput(inputRef);

    // Helper functions
    const createFinalChange = (state: TimePickerState) => {
        const timestamp = isInputState(state) ? parseStringToTime(state.inputValue, pattern) : state.timestamp;
        return timestamp 
            ? createTimestampChange(timestamp % MAX_TIMESTAMP) 
            : createInputChange((state as InputState).inputValue);
    }

    // Event handlers
    const handleBlur = () => {
        const change = createFinalChange(currentState);
        sendFinalChange(change);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case ENTER_KEY:
                e.stopPropagation();
                const input = e.currentTarget;
                input.dispatchEvent(new CustomEvent("cTab", { bubbles: true }));
                break;
            case ARROW_UP_KEY:
            case ARROW_DOWN_KEY:
                if (isInputState(currentState)) break;
                e.preventDefault();
                e.stopPropagation();
                const increment = e.key === ARROW_UP_KEY ? 1 : -1;
                const cursorPosition = e.currentTarget.selectionStart || 0;
                const currentFMTChar = getCurrentFMTChar(pattern, cursorPosition);
                if (!currentFMTChar) break;
                const adjustedTime = getAdjustedTime(currentState.timestamp, currentFMTChar, e.ctrlKey, increment);
                sendTempChange(createTimestampChange(adjustedTime));
                setSelection(pattern.indexOf(currentFMTChar), pattern.lastIndexOf(currentFMTChar) + 1);
                break;
            case ESCAPE_KEY:
                const change = createFinalChange(lastFinalState.current);
                sendTempChange(change);
                setTimeout(() => inputBoxRef.current?.focus());
        }
    }

    return (
        <div ref={inputBoxRef} 
             className={clsx('inputBox', focusClass)} 
             onClick={(e) => e.stopPropagation()} 
             {...focusHtml} >

            <input type='text'
                   ref={inputRef}
                   value={inputValue}
                   onChange={(e) => sendTempChange(createInputChange(e.target.value))}
                   onBlur={handleBlur}
                   onKeyDown={handleKeyDown} />
                   
            {children &&
                <div className='sideContent'>{children}</div>}
        </div>
    );
}

export type { TimePickerState, TimestampState, InputState };
export { TimePicker };