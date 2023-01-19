import React, { ChangeEvent, ReactNode } from "react";
import clsx from "clsx";
import { usePatchSync } from "../exchange/patch-sync";
import { changeToPatch, isInputState, patchToChange } from "./timepicker-exchange";

interface TimePickerProps {
	key: string,
	identity: Object,
	state: TimePickerState,
    deferredSend?: boolean,
	children?: ReactNode[]
}

type TimePickerState = InputState | TimestampState;

interface InputState {
	tp: 'input-state',
	inputValue: string,
    tempTimestamp?: number
}

interface TimestampState {
	tp: 'timestring-state',
	timestamp: number   // 15:30 = 15*60*60*1000 + 30*60*1000
}

function TimePicker({identity, state, deferredSend = true, children}: TimePickerProps) {
    const { currentState, sendTempChange, sendFinalChange } =
        usePatchSync(identity, 'receiver', state, deferredSend, s => s, changeToPatch, patchToChange, (prev, ch) => ch);

    const inputValue = isInputState(currentState) ? currentState.inputValue : convertMsToTime(currentState.timestamp);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        sendTempChange({ tp: 'input-state', inputValue: e.target.value });
    }

    return (
        <div className={clsx("inputBox")} onClick={(e) => e.stopPropagation()} >
            <input value={inputValue} onChange={handleChange} />

            {children && 
                <div className='sideContent'>
                    {children}
                </div>}
        </div>
    );
}

const padTo2Digits = (num: number) =>  num.toString().padStart(2, '0');

function convertMsToTime(milliseconds: number) {
    const totalMins = Math.floor(milliseconds / 60000);
    const totalHours = Math.floor(totalMins / 60);
    return `${padTo2Digits(totalHours % 24)}:${padTo2Digits(totalMins % 60)}`;
}

export { TimePicker };
export type { TimePickerState, TimestampState, InputState };