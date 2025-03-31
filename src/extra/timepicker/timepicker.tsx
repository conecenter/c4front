import React, { ReactNode, useRef } from "react";
import clsx from "clsx";
import { usePatchSync } from "../exchange/patch-sync";
import { patchSyncTransformers } from "./timepicker-exchange";
import { ARROW_DOWN_KEY, ARROW_UP_KEY, ENTER_KEY, ESCAPE_KEY } from "../../main/keyboard-keys";
import { useSelectionEditableInput } from "../datepicker/selection-control";
import { useUserLocale } from "../locale";
import { useFocusControl } from "../focus-control";
import { usePath } from "../../main/vdom-hooks";
import { PopupElement } from "../popup-elements/popup-element";
import { usePopupState } from "../popup-elements/popup-manager";
import { TimeSliderBlock, TIME_ITEM_HEIGHT } from "./time-slider";
import { copyToClipboard } from "../utils";
import { identityAt } from "../../main/vdom-util";
import { BACKSPACE_EVENT, COPY_EVENT, CUT_EVENT, DELETE_EVENT, ENTER_EVENT, PASTE_EVENT, useExternalKeyboardControls }
    from "../focus-module-interface";
import { createInputChange, createTimestampChange, parseStringToTime, isInputState, formatTimestamp, getCurrentFMTChar,
    getCurrentTokenValue, getAdjustedTime, MAX_TIMESTAMP, TIME_TOKENS, TOKEN_DATA } from "./time-utils";

const receiverIdOf = identityAt('receiver');

interface TimePickerProps {
	key: string,
	identity: object,
	state: TimePickerState,
    offset?: number,
    timestampFormatId: number,
    readonly?: boolean,
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

function TimePicker({identity, state, offset, timestampFormatId, readonly, children}: TimePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const inputBoxRef = useRef<HTMLInputElement>(null);
    const lastFinalState = useRef(state);  // return last final state on Esc

    // Server exchange initialization
    const { currentState, sendTempChange, sendFinalChange: onFinalChange, wasChanged } =
        usePatchSync(receiverIdOf(identity), state, true, patchSyncTransformers);

    const sendFinalChange = (change: TimePickerState) => {
        if (wasChanged) {
            lastFinalState.current = change;
            onFinalChange(change);
        }
    }

    // Getting time pattern from locale
    const locale = useUserLocale();
	const timestampFormat = locale.timeFormats.find(format => format.id === timestampFormatId);
    const pattern = timestampFormat?.pattern || 'HH:mm';
    const usedTokens = TIME_TOKENS.filter(token => pattern.includes(token));

    // Get formatted input value
    const inputValue = isInputState(currentState)
        ? currentState.inputValue : formatTimestamp(currentState.timestamp, usedTokens, offset);

    // Focus functionality
    const path = usePath(identity);
    const { focusClass, focusHtml } = useFocusControl(path);

    const setSelection = useSelectionEditableInput(inputRef);

    // Popup functionality
    const { isOpened, toggle } = usePopupState(path);

    const onTimeSliderClick = (i: number, token: string) => {
        const newTimestamp = isInputState(currentState)
            ? TOKEN_DATA[token].ms * i
            : currentState.timestamp - (TOKEN_DATA[token].get(currentState.timestamp) - i) * TOKEN_DATA[token].ms;
        sendTempChange(createTimestampChange(newTimestamp));
    }

    // Helper functions
    const createFinalChange = (state: TimePickerState) => {
        const timestamp = isInputState(state) ? parseStringToTime(state.inputValue, usedTokens) : state.timestamp;
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
        e.stopPropagation();
        switch (e.key) {
            case ENTER_KEY: {
                e.stopPropagation();
                const input = e.currentTarget;
                input.dispatchEvent(new CustomEvent("cTab", { bubbles: true }));
                break;
            }
            case ARROW_DOWN_KEY:
                if (e.altKey) return toggle(!isOpened);
                // fallthrough
            case ARROW_UP_KEY: {
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
            }
            case ESCAPE_KEY: {
                const change = createFinalChange(lastFinalState.current);
                sendTempChange(change);
                toggle(false);
                setTimeout(() => inputBoxRef.current?.focus());
            }
        }
    }

    // Interaction with FocusModule - Excel-style keyboard controls
    function focusInputEnd() {
        const endPosition = inputRef.current?.value.length || 0;
        setSelection(endPosition, endPosition);
		inputRef.current?.focus();
	}
	function clearAndFocusInput() {
		sendTempChange(createInputChange(''));
		inputRef.current?.focus();
	}
	function handleClipboardWrite(e: CustomEvent) {
        const input = e.currentTarget as HTMLInputElement;
        copyToClipboard(input.value);
        if (e.type === 'ccopy') {
            setSelection(0, input.value.length);
            input.focus();
        } else sendFinalChange(createInputChange(''));
	}
	const handleCustomPaste = (e: CustomEvent) => sendFinalChange(createFinalChange(e.detail));

	const keyboardEventHandlers = {
		[ENTER_EVENT]: focusInputEnd,
		[DELETE_EVENT]: clearAndFocusInput,
		[BACKSPACE_EVENT]: clearAndFocusInput,
		[PASTE_EVENT]: handleCustomPaste,
		[COPY_EVENT]: handleClipboardWrite,
		[CUT_EVENT]: handleClipboardWrite
	};

	useExternalKeyboardControls(!readonly ? inputRef.current : null, keyboardEventHandlers);

    return (
        <div ref={inputBoxRef}
             className={clsx('inputBox', focusClass)}
             style={{...readonly && {borderColor: 'transparent'}}}
             onClick={(e) => e.stopPropagation()}
             onBlur={!readonly ? handleBlur : undefined}
             {...focusHtml} >

            <input type='text'
                   ref={inputRef}
                   value={inputValue}
                   readOnly={readonly}
                   style={{ minWidth: '2em' }}  // override for CSS
                   onChange={(e) => sendTempChange(createInputChange(e.target.value))}
                   onKeyDown={!readonly ? handleKeyDown : undefined} />

            {!readonly &&
                <button type='button'
                        className={clsx('btnTimepicker', isOpened && 'rotate180deg')}
                        onClick={() => toggle(!isOpened)} />}

            {children &&
                <div className='sideContent'>{children}</div>}

            {isOpened &&
                <PopupElement popupKey={path} className='timepickerPopup'>
                    <div className='timepickerPopupBox'
                         onMouseDown={(e) => e.preventDefault()}
                         onKeyDown={(e) => e.stopPropagation()}
                         style={{ height: `${7*TIME_ITEM_HEIGHT}em`}}>

                        {usedTokens.map(token => (
                            <TimeSliderBlock key={token}
                                            token={token}
                                            current={getCurrentTokenValue(currentState, token)}
                                            onClick={onTimeSliderClick} />))}
                    </div>
                </PopupElement>}
        </div>
    );
}


export type { TimePickerState, TimestampState, InputState };
export { TimePicker };