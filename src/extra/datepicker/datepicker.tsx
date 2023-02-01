import React, {ReactNode, useMemo, useRef} from "react";
import clsx from 'clsx';
import {getDateTimeFormat, useUserLocale} from "../locale";
import {DateSettings, formatDate, getDate, parseStringToDate} from "./date-utils";
import {getOrElse, mapOption, None, nonEmpty, Option} from "../../main/option";
import {useSelectionEditableInput} from "./selection-control";
import {DatepickerCalendar} from "./datepicker-calendar";
import { usePatchSync } from '../exchange/patch-sync';
import { useFocusControl } from '../focus-control';
import {
	BACKSPACE_EVENT, 
	COPY_EVENT, 
	CUT_EVENT, 
	DELETE_EVENT, 
	ENTER_EVENT, 
	PASTE_EVENT, 
	useExternalKeyboardControls
} from '../focus-module-interface';
import {
	applyChange, 
	changeToPatch, 
	createInputChange, 
	DatePickerState, 
	patchToChange, 
	serverStateToState
} from "./datepicker-exchange";
import {
	getOnBlur, 
	getOnChange,
	getOnKeyDown, 
	onTimestampChangeAction, 
	getOnPopupToggle, 
	getOnInputBoxBlur
} from "./datepicker-actions";


type DatePickerServerState = TimestampServerState | InputServerState

interface InputServerState extends PopupServerState {
	tp: 'input-state',
	inputValue: string,
	tempTimestamp?: string
}

interface TimestampServerState extends PopupServerState {
	tp: 'timestamp-state',
	timestamp: string
}

interface PopupServerState {
	popupDate?: string
}

interface DatePickerProps {
	key: string
	identity: Object
	state: DatePickerServerState
	timestampFormatId: number
	userTimezoneId?: string
	deferredSend?: boolean,
	path?: string,
	children?: ReactNode[]
}

export function DatePickerInputElement({
		identity,
		state,
		timestampFormatId,
		userTimezoneId,
		deferredSend,
		path,
		children
}: DatePickerProps) {
	const locale = useUserLocale()
	const timezoneId = userTimezoneId ? userTimezoneId : locale.timezoneId
	const timestampFormat = getDateTimeFormat(timestampFormatId, locale)
	const dateSettings: DateSettings = {timestampFormat: timestampFormat, locale: locale, timezoneId: timezoneId}

	const { currentState, sendTempChange, sendFinalChange } = usePatchSync(
        identity,
        'receiver',
        state,
        !!deferredSend,
        serverStateToState,
        changeToPatch,
        patchToChange,
        applyChange
    );

	const memoInputValue = useRef('')

	const {
		date: currentDateOpt,
		dateFormat,
		inputValue
	} = useMemo(() => getCurrentProps(currentState, dateSettings, memoInputValue), [currentState, dateSettings])

	const inputRef = useRef<HTMLInputElement>(null)
	const inputBoxRef = useRef(null)

	// Interaction with FocusModule (c4e\client\src\extra\focus-module.js) - Excel-style keyboard controls
	const keyboardEventHandlers = {
		[ENTER_EVENT]: handleCustomEnter,
		[DELETE_EVENT]: handleCustomDelete,
		[BACKSPACE_EVENT]: handleCustomDelete,
		[PASTE_EVENT]: handleCustomPaste,
		[COPY_EVENT]: handleClipboardWrite,
		[CUT_EVENT]: handleClipboardWrite
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
		sendTempChange(createInputChange(''));
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
				sendFinalChange(createInputChange(''));
				memoInputValue.current = '';
			}
		} catch(err) {
			console.log(err);
		}
	}

	function handleCustomPaste(e: CustomEvent) {
		if (isFocusedInside(inputBoxRef.current)) return;
		const inputVal = e.detail;
		sendFinalChange(
			getOrElse(
				mapOption(parseStringToDate(inputVal, dateSettings), timestamp => createInputChange(inputVal, timestamp)),
				createInputChange(inputVal)
			)
		);
		memoInputValue.current = inputVal;
	}

	useExternalKeyboardControls(inputRef.current, keyboardEventHandlers);

	const setSelection: (from: number, to: number) => void = useSelectionEditableInput(inputRef)
	const onTimestampChange: (timestamp: number) => void = onTimestampChangeAction(currentState, dateSettings, sendTempChange)
	const onInputBlur = getOnBlur(currentState, memoInputValue, sendFinalChange, inputBoxRef, dateSettings)
	const onInputBoxBlur = getOnInputBoxBlur(currentState, sendFinalChange)
	const onChange = getOnChange(dateSettings, sendTempChange)
	const onPopupToggle = getOnPopupToggle(currentDateOpt, currentState, dateSettings, sendFinalChange)
	const onKeyDown = getOnKeyDown(
		currentDateOpt,
		dateFormat,
		dateSettings,
		memoInputValue,
		onTimestampChange,
		setSelection,
		sendFinalChange,
		inputBoxRef
	)

	const { focusClass, focusHtml } = useFocusControl(path);

  	return (
		<div ref={inputBoxRef} 
			 className={clsx("inputBox", focusClass)}
			 onClick={(e) => e.stopPropagation()}
			 onBlur={onInputBoxBlur}			 
			 {...focusHtml} >

			<div className="inputSubBox">
				<input ref={inputRef} value={inputValue} onChange={onChange} onKeyDown={onKeyDown} onBlur={onInputBlur} />
			</div>

			<button 
				type='button' 
				className={`${currentState.popupDate ? 'rotate180deg ' : ''}btnCalendar`} 
				onClick={onPopupToggle} />

			<div className='sideContent'>
				{children}
			</div>

			{currentState.popupDate &&
				<DatepickerCalendar { ...{currentState, currentDateOpt, dateSettings, sendFinalChange, inputRef} } />}
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
	if (!element) return false;
	const activeElement = element.ownerDocument.activeElement;
	return element.contains(activeElement) && element !== activeElement;
}

export const components = {DatePickerInputElement}
export type {DatePickerServerState}