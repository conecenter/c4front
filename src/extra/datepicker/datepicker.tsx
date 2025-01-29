import React, {ReactNode, useContext, useEffect, useMemo, useRef} from "react";
import clsx from 'clsx';
import {getDateTimeFormat, useUserLocale} from "../locale";
import {DateSettings, formatDate, getDate, getPopupDate, parseStringToDate} from "./date-utils";
import {getOrElse, mapOption, None, nonEmpty, Option} from "../../main/option";
import {useSelectionEditableInput} from "./selection-control";
import {DatepickerCalendar} from "./datepicker-calendar";
import {usePatchSync} from '../exchange/patch-sync';
import {useFocusControl} from '../focus-control';
import {VkInfoContext} from "../ui-info-provider";
import { usePopupState } from "../popup-elements/popup-manager";
import { PopupElement } from "../popup-elements/popup-element";
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
	createPopupChange,
	createTimestampChange,
	DatepickerChange,
	DatePickerState,
	patchToChange,
	serverStateToState
} from "./datepicker-exchange";
import {
	getOnBlur,
	getOnChange,
	getOnKeyDown,
	onTimestampChangeAction,
	getOnInputBoxBlur
} from "./datepicker-actions";
import { Identity } from "../utils";


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
	identity: Identity
	state: DatePickerServerState
	timestampFormatId: number
	userTimezoneId?: string
	deferredSend?: boolean,
	path: string,
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

	const dateChanged = useRef(false);

	const { currentState, sendTempChange: onTempChange, sendFinalChange: onFinalChange } = usePatchSync(
        identity,
        'receiver',
        state,
        !!deferredSend,
        serverStateToState,
        changeToPatch,
        patchToChange,
        applyChange
    );
	const sendTempChange = (change: DatepickerChange) => {
		if (change.tp === 'dateChange') dateChanged.current = true;
		onTempChange(change);
	}
	const sendFinalChange = (change: DatepickerChange, force = false) => {
		if (!force && change.tp === "dateChange" && !dateChanged.current) return;
		onFinalChange(change);
		dateChanged.current = false;
	}

	const memoInputValue = useRef('')

	const {
		date: currentDateOpt,
		dateFormat,
		inputValue
	} = useMemo(() => getCurrentProps(currentState, dateSettings, memoInputValue), [currentState, dateSettings])

	const inputRef = useRef<HTMLInputElement>(null)
	const inputBoxRef = useRef<HTMLDivElement>(null)

	const { isOpened, toggle } = usePopupState(path);
	const togglePopup = () => toggle(!isOpened);

	useEffect(function calcInitCalendarState() {
		const dateToShow = isOpened ? getOrElse(currentDateOpt, getDate(Date.now(), dateSettings)) : None;
		const popupDate = getOrElse(mapOption(dateToShow, getPopupDate), null);
		sendTempChange(createPopupChange(popupDate));
	}, [isOpened]);

	// Interaction with FocusModule & VK
	const keyboardEventHandlers = {
		[ENTER_EVENT]: handleCustomEnter,
		[DELETE_EVENT]: handleCustomDelete,
		[BACKSPACE_EVENT]: handleCustomDelete,
		[PASTE_EVENT]: handleCustomPaste,
		[COPY_EVENT]: handleClipboardWrite,
		[CUT_EVENT]: handleClipboardWrite
	};

	function handleCustomEnter(e: CustomEvent) {
		if (!isFocusedInside(inputBoxRef.current)) {
			const input = e.currentTarget as HTMLInputElement;
			const inputLength = input.value.length;
			input.setSelectionRange(inputLength, inputLength);
			input.focus();
		} else if (isVkEvent(e)) {
			const currTarget = e.currentTarget;
			setTimeout(() => currTarget!.dispatchEvent(new CustomEvent("cTab", { bubbles: true })));
		}
	}

	function handleCustomDelete(e: CustomEvent<{key: string, vk: boolean}>) {
		if (!isFocusedInside(inputBoxRef.current)) {
			(e.currentTarget as HTMLInputElement).focus();
			const newValue = isVkEvent(e) && e.type !== 'backspace' ? e.detail.key : '';
			sendTempChange(getOrElse(
				mapOption(
					parseStringToDate(newValue, dateSettings),
					timestamp => createInputChange(newValue, timestamp)
				),
				createInputChange(newValue)
			));
		} else if (isVkEvent(e)) {
			let command: [string, boolean?, string?];
			switch (e.detail.key) {
				case '':
					command = ['forwardDelete'];
					break;
				case 'Backspace':
					command = ['delete'];
					break;
				default:
					command = ['insertText', false, e.detail.key];
			}
			inputBoxRef.current?.ownerDocument.execCommand(...command);
		}
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
				sendFinalChange(createInputChange(''), true);
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
				mapOption(parseStringToDate(inputVal, dateSettings), timestamp => createTimestampChange(timestamp)),
				createInputChange(inputVal)
			),
			true
		);
		memoInputValue.current = inputVal;
	}

	useExternalKeyboardControls(inputRef.current, keyboardEventHandlers);

	const setSelection: (from: number, to: number) => void = useSelectionEditableInput(inputRef)
	const onTimestampChange: (timestamp: number) => void = onTimestampChangeAction(currentState, dateSettings, sendTempChange)
	const onInputBlur = getOnBlur(currentState, memoInputValue, sendTempChange, inputBoxRef, dateSettings)
	const onInputBoxBlur = getOnInputBoxBlur(currentState, memoInputValue, sendFinalChange)
	const onChange = getOnChange(dateSettings, sendTempChange)
	const onKeyDown = getOnKeyDown(
		currentDateOpt,
		dateFormat,
		dateSettings,
		memoInputValue,
		onTimestampChange,
		setSelection,
		sendTempChange,
		inputBoxRef,
		togglePopup
	)

	const { focusClass, focusHtml } = useFocusControl(path);

	const { haveVk } = useContext(VkInfoContext);

	return (
		<div ref={inputBoxRef}
			 className={clsx("inputBox", focusClass)}
			 onClick={(e) => e.stopPropagation()}
			 onBlur={onInputBoxBlur}
			 {...focusHtml} >

			<input ref={inputRef}
				value={inputValue}
				onChange={onChange}
				onKeyDown={onKeyDown}
				onBlur={onInputBlur}
				inputMode={haveVk ? 'none' : undefined}
			/>

			<button
				type='button'
				className={clsx('btnCalendar', currentState.popupDate && 'rotate180deg')}
				onClick={togglePopup} />

			<div className='sideContent'>
				{children}
			</div>

			{isOpened && <PopupElement popupKey={path}>
				{currentState.popupDate && <DatepickerCalendar {...{
					currentState,
					currentDateOpt,
					dateSettings,
					sendFinalChange,
					sendTempChange,
					inputRef,
					closePopup: () => toggle(false)
				}} />}
			</PopupElement>}
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
		case "timestamp-state": {
			const date = getDate(currentState.timestamp, dateSettings)
			const formatInfo = mapOption(date, date => formatDate(date, dateSettings))
			const [formattedDate, dateFormat] = nonEmpty(formatInfo) ? formatInfo : ["", None]
			memoInputValue.current = formattedDate;
			return {date: date, dateFormat: dateFormat, inputValue: formattedDate}
		}
	}
}

function isFocusedInside(element: HTMLElement | null) {
	if (!element) return false;
	const activeElement = element.ownerDocument.activeElement;
	return element.contains(activeElement) && element !== activeElement;
}

function isVkEvent(e: CustomEvent<{key: string, vk: boolean}>) {
	return e.detail.vk;
}

export const components = {DatePickerInputElement}
export type {DatePickerServerState}