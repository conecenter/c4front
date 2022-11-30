import React, { ReactNode, useState } from "react";
import clsx from "clsx";
import { usePatchSync } from "../exchange/patch-sync";
import { changeToPatch } from "./timepicker-exchange";

interface TimePickerProps {
	key: string,
	identity: Object,
	state: TimePickerState,
	timeFormatId: number,
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

function TimePicker({identity, state, timeFormatId, deferredSend = true, children}: TimePickerProps) {
    const { currentState, sendTempChange, sendFinalChange } = usePatchSync(
        identity,
        'receiver',
        state,
        deferredSend,
        s => s,
        changeToPatch,
        patchToChange,
        applyChange
    );

    const [inputValue, setInputValue] = useState<TimeStringState>({ tp: 'timestring-state', time: '00:00'});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue({ tp: 'timestring-state', time: e.target.value });
    }

    return (
        <div className={clsx("inputBox")} onClick={(e) => e.stopPropagation()} >
            <div className="inputSubBox">
                <input value={inputValue.time} onChange={handleChange} />
            </div>

            {children && 
                <div className='sideContent'>
                    {children}
                </div>}
        </div>
    );
}

export { TimePicker };
export type { TimePickerState, TimestampState, InputState };