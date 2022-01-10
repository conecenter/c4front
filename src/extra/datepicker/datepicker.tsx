import React, {ReactNode, useMemo, useRef} from "react";
import {getDateTimeFormat, useUserLocale} from "../locale";
import {DatePickerState, useDatePickerStateSync} from "./datepicker-exchange";
import {DateSettings, formatDate, getDate} from "./date-utils";
import {mapOption, None, nonEmpty, Option} from "../../main/option";
import {useSelectionEditableInput} from "./selection-control";
import {DatepickerCalendar} from "./datepicker-calendar";
import {getOnBlur, getOnChange, getOnKeyDown, onTimestampChangeAction, getOnPopupToggle} from "./datepicker-actions";

type DatePickerServerState = TimestampServerState | InputServerState

interface PopupServerState {
	popupDate?: string | undefined
}

interface InputServerState extends PopupServerState {
	tp: 'input-state',
	inputValue: string,
	tempTimestamp?: string
}

interface TimestampServerState extends PopupServerState {
	tp: 'timestamp-state',
	timestamp: string
}

interface DatePickerProps {
	key: string
	identity: Object
	state: DatePickerServerState
	timestampFormatId: number
	userTimezoneId?: string
	deferredSend?: boolean
	children?: ReactNode[]
}

export function DatePickerInputElement({
		identity,
		state,
		timestampFormatId,
		userTimezoneId,
		deferredSend,
		children
}: DatePickerProps) {
	const locale = useUserLocale()
	const timezoneId = userTimezoneId ? userTimezoneId : locale.timezoneId
	const timestampFormat = getDateTimeFormat(timestampFormatId, locale)
	const dateSettings: DateSettings = {timestampFormat: timestampFormat, locale: locale, timezoneId: timezoneId}
	const {
		currentState,
		setTempState,
		setFinalState
	} = useDatePickerStateSync(identity, state, dateSettings, deferredSend || false)
	const {
		date: currentDateOpt,
		dateFormat,
		inputValue
	} = useMemo(() => getCurrentProps(currentState, dateSettings), [currentState, dateSettings])

	const inputRef = useRef(null)
	const inputBoxRef = useRef(null)

	const setSelection: (from: number, to: number) => void = useSelectionEditableInput(inputRef)
	const onTimestampChange: (timestamp: number) => void = onTimestampChangeAction(setTempState)
	const onBlur = getOnBlur(currentState, setFinalState)
	const onKeyDown = getOnKeyDown(currentDateOpt, dateFormat, dateSettings, onTimestampChange, setSelection, onBlur)
	const onChange = getOnChange(dateSettings, setTempState)
	const onPopupToggle = getOnPopupToggle(currentDateOpt, currentState, dateSettings, setFinalState)

  	return (
		<div className="inputBoxWrapper">
			<div ref={inputBoxRef} className="inputBox">
				<div className="inputSubBox">
					<input ref={inputRef} value={inputValue} onChange={onChange} onKeyDown={onKeyDown} onBlur={onBlur} />
				</div>
				<button 
					type='button' 
					className={`${currentState.popupDate ? 'rotate180deg ' : ''}btnCalendar`} 
					onClick={onPopupToggle} />
			</div>

			{currentState.popupDate && 
				<DatepickerCalendar {...{
					currentState, 
					currentDateOpt, 
					dateSettings, 
					setFinalState, 
					inputRef, 
					inputBoxRef
				}} />
			}

			{children}
		</div>
	);
}

interface CurrentProps {
	date: Option<Date>
	dateFormat: Option<string>
	inputValue: string
}

function getCurrentProps(currentState: DatePickerState, dateSettings: DateSettings): CurrentProps {
	switch (currentState.tp) {
		case "input-state":
			return {date: None, dateFormat: None, inputValue: currentState.inputValue,}
		case "timestamp-state":
				const date = getDate(currentState.timestamp, dateSettings)
				const formatInfo = mapOption(date, date => formatDate(date, dateSettings))
				const [formattedDate, dateFormat] = nonEmpty(formatInfo) ? formatInfo : ["", None]
				return {date: date, dateFormat: dateFormat, inputValue: formattedDate,}
	}
}

export const components = {DatePickerInputElement}
export type {DatePickerServerState}