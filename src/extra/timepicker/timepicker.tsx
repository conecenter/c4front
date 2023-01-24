import React, { ChangeEvent, ReactNode, useRef } from "react";
import clsx from "clsx";
import { usePatchSync } from "../exchange/patch-sync";
import { changeToPatch, patchToChange } from "./timepicker-exchange";
import { createInputChange, createTimestampChange, parseStringToTime, isInputState, TOKEN_TO_MS, formatTimestamp } from "./time-utils";
import { ARROW_DOWN_KEY, ARROW_UP_KEY } from "../../main/keyboard-keys";
import { useSelectionEditableInput } from "../datepicker/selection-control";
import { useUserLocale } from "../locale";

const TIME_FORMAT = 'hhhmmm';

interface TimePickerProps {
	key: string,
	identity: Object,
	state: TimePickerState,
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

function TimePicker({identity, state, timestampFormatId, children}: TimePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const locale = useUserLocale();
	const timestampFormat = locale.timeFormats.find(format => format.id === timestampFormatId);
    const pattern = timestampFormat?.pattern || 'hh:mm';

    const { currentState, sendTempChange, sendFinalChange } =
        usePatchSync(identity, 'receiver', state, true, s => s, changeToPatch, patchToChange, (prev, ch) => ch);

    const inputValue = isInputState(currentState) ? currentState.inputValue : formatTimestamp(currentState.timestamp, pattern);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        sendTempChange({ tp: 'input-state', inputValue: e.target.value });
    }

    const handleBlur = () => {
        const timestamp = isInputState(currentState) ? parseStringToTime(currentState.inputValue, pattern) : currentState.timestamp;
        const change = timestamp ? createTimestampChange(timestamp) : createInputChange((currentState as InputState).inputValue);
        sendFinalChange(change);
    }

    const setSelection = useSelectionEditableInput(inputRef);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case ARROW_UP_KEY:
            case ARROW_DOWN_KEY:
                if (isInputState(currentState)) break;
                const cycleThroughout = !e.ctrlKey;
                const increment = e.key === ARROW_UP_KEY ? 1 : -1;
                const cursorPosition = e.currentTarget.selectionStart || 0;
                const currentFMTChar = TIME_FORMAT[cursorPosition] as 'h' | 'm';
                const adjustedTime = currentState.timestamp + (increment * TOKEN_TO_MS[currentFMTChar]);
                sendTempChange(createTimestampChange(adjustedTime));
                // Focus adjusted part
                const startPosition = TIME_FORMAT.indexOf(currentFMTChar);
                const endPosition = TIME_FORMAT.lastIndexOf(currentFMTChar);
                setSelection(startPosition, endPosition);
                e.preventDefault();
                e.stopPropagation();
        }
    }

    return (
        <div className={clsx("inputBox")} onClick={(e) => e.stopPropagation()} >
            <input type='text' 
                   ref={inputRef} 
                   value={inputValue} 
                   onChange={(e) => sendTempChange(createInputChange(e.target.value))}
                   onBlur={handleBlur} 
                   onKeyDown={handleKeyDown} />
            {children && 
                <div className='sideContent'>
                    {children}
                </div>}
        </div>
    );
}

export type { TimePickerState, TimestampState, InputState };
export { TimePicker };