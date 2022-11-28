import React, { ReactNode } from "react";
import clsx from "clsx";

interface TimePickerProps {
	key: string
	identity: Object
	state: TimePickerState
	timeFormatId: number,
	children?: ReactNode[]
}

type TimePickerState = TimeStringState | InputState

interface InputState {
	tp: 'input-state',
	inputValue: string
}

interface TimeStringState {
	tp: 'timestring-state',
	time: string
}

function TimePicker({identity, state, timeFormatId, children}: TimePickerProps) {

    return (
        <div className={clsx("inputBox")} onClick={(e) => e.stopPropagation()} >
            <div className="inputSubBox">
                <input value={"00:00"} /*onChange={onChange}*/ />
            </div>

            <div className='sideContent'>
                {children}
            </div>
        </div>
    );
}

export {TimePicker};