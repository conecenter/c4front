import React, {ReactNode, useMemo, useRef} from "react";
import {getDateTimeFormat, useUserLocale} from "../locale";
import {createInputState, DatePickerState, useDatePickerStateSync} from "./datepicker-exchange";
import {DateSettings, formatDate, getDate, parseStringToDate} from "./date-utils";
import {getOrElse, mapOption, None, nonEmpty, Option} from "../../main/option";
import {useSelectionEditableInput} from "./selection-control";
import {DatepickerCalendar} from "./datepicker-calendar";
import {getOnBlur, getOnChange, getOnKeyDown, onTimestampChangeAction, getOnPopupToggle} from "./datepicker-actions";
import { useExternalKeyboardControls } from '../../main/custom-hooks';

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

	const memoInputValue = useRef('')

	const {
		date: currentDateOpt,
		dateFormat,
		inputValue
	} = useMemo(() => getCurrentProps(currentState, dateSettings, memoInputValue), [currentState, dateSettings])

	const inputRef = useRef<HTMLInputElement>(null)
	const inputBoxRef = useRef(null)

	// Interaction with FocusModule (c4e\client\src\extra\focus-module.js) - Excel-style keyboard controls
	const customEventHandlers = {
		enter: handleCustomEnter,
		delete: handleCustomDelete,
		backspace: handleCustomDelete,
		cpaste: handleCustomPaste,
		ccopy: handleClipboardWrite,
		ccut: handleClipboardWrite
	};

	function handleCustomEnter(e: CustomEvent) {
		if (isFocusedInside(inputBoxRef.current)) return;
		const input = e.currentTarget as HTMLInputElement;
		const inputLength = input.value.length;
		input.setSelectionRange(inputLength, inputLength);
		input.focus();
	}

	function handleCustomDelete(e: CustomEvent) {
		if (isFocusedInside(inputBoxRef.current)) return;
		setTempState(createInputState(''));
		(e.currentTarget as HTMLInputElement).focus();
	}

	async function handleClipboardWrite(e: CustomEvent) {
		// On Firefox writing to the clipboard is blocked (available only from user-initiated event callbacks)
		if (isFocusedInside(inputBoxRef.current)) return;
		try {
			const input = e.currentTarget as HTMLInputElement;
			await navigator.clipboard.writeText(input.value);
			if (e.type === 'ccopy') {
				input.setSelectionRange(0, input.value.length);
				input.focus();
			} else {
				setFinalState(createInputState(''));
				memoInputValue.current = '';
			}
		} catch(err) {
			console.log(err);
		}
	}
	
	function handleCustomPaste(e: CustomEvent) {
		if (isFocusedInside(inputBoxRef.current)) return;
		const inputVal = e.detail;
		setFinalState(
			getOrElse(
				mapOption(parseStringToDate(inputVal, dateSettings), timestamp => createInputState(inputVal, timestamp)),
				createInputState(inputVal)
			)
		);
		memoInputValue.current = inputVal;
	}

	useExternalKeyboardControls(inputRef, customEventHandlers);

	const setSelection: (from: number, to: number) => void = useSelectionEditableInput(inputRef)
	const onTimestampChange: (timestamp: number) => void = onTimestampChangeAction(setTempState)
	const onBlur = getOnBlur(currentState, memoInputValue, setFinalState)
	const onChange = getOnChange(dateSettings, setTempState)
	const onPopupToggle = getOnPopupToggle(currentDateOpt, currentState, dateSettings, setFinalState)
	const onKeyDown = getOnKeyDown(
		currentDateOpt, 
		dateFormat, 
		dateSettings, 
		memoInputValue, 
		onTimestampChange, 
		setSelection, 
		setFinalState
	)	

  	return (
		<div ref={inputBoxRef} className="inputBox">
			<div className="inputSubBox">
				<input ref={inputRef} value={inputValue} onChange={onChange} onKeyDown={onKeyDown} onBlur={onBlur} />
			</div>
			<button 
				type='button' 
				className={`${currentState.popupDate ? 'rotate180deg ' : ''}btnCalendar`} 
				onClick={onPopupToggle} />
			{children}
			{currentState.popupDate && 
				<DatepickerCalendar {...{
					currentState, 
					currentDateOpt, 
					dateSettings, 
					setFinalState, 
					inputRef, 
					inputBoxRef
				}} />}
		</div>

	);
}

interface CurrentProps {
	date: Option<Date>
	dateFormat: Option<string>
	inputValue: string
}

function getCurrentProps(
	currentState: DatePickerState, 
	dateSettings: DateSettings, 
	memoInputValue: React.MutableRefObject<string>
): CurrentProps {
	switch (currentState.tp) {
		case "input-state":
			return {date: None, dateFormat: None, inputValue: currentState.inputValue,}
		case "timestamp-state":
			const date = getDate(currentState.timestamp, dateSettings)
			const formatInfo = mapOption(date, date => formatDate(date, dateSettings))
			const [formattedDate, dateFormat] = nonEmpty(formatInfo) ? formatInfo : ["", None]
			memoInputValue.current = formattedDate;
			return {date: date, dateFormat: dateFormat, inputValue: formattedDate,}
	}
}

function isFocusedInside(element: HTMLElement | null) {
	if (element) return element.contains(element.ownerDocument.activeElement);
}

export const components = {DatePickerInputElement}
export type {DatePickerServerState}