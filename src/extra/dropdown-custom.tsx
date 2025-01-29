import React, { ReactNode, useRef, useState } from "react";
import clsx from 'clsx';
import { ARROW_DOWN_KEY, ARROW_UP_KEY, ENTER_KEY, ESCAPE_KEY } from '../main/keyboard-keys';
import { usePopupPos } from '../main/popup';
import { useSync } from '../main/vdom-hooks';
import { identityAt } from '../main/vdom-util';
import { usePatchSync, Patch } from './exchange/patch-sync';
import { isInstanceOfNode } from './dom-utils';
import { Identity } from "./utils";
import { 
	BACKSPACE_EVENT, 
	COPY_EVENT, 
	CUT_EVENT, 
	DELETE_EVENT, 
	ENTER_EVENT, 
	PASTE_EVENT, 
	TAB_EVENT, 
	useExternalKeyboardControls 
} from './focus-module-interface';

interface DropdownProps {
	key: string,
	identity: Identity,
	state: DropdownState,
	content: Content[],
	popupChildren: ReactNode[],
	ro: boolean,
	popupClassname?: string,
	children?: ReactNode[]
}

interface DropdownState {
	inputValue: string,
	mode: Mode,
	popupOpen: boolean
}

type Mode = 'content'|'input';

type Content = Chip | Text;

interface Chip {
	text: string,
	bgColor: string,
	textColor: string
}

interface Text {
	text: string
}

const receiverIdOf = identityAt('receiver');
const patchSyncTransformers = { serverToState, changeToPatch, patchToChange, applyChange };

const isChip = (item: Content): item is Chip => (item as Chip).bgColor !== undefined;

export function DropdownCustom({ identity, state, content, popupChildren, ro, popupClassname, children }: DropdownProps) {
	const { currentState, sendTempChange, sendFinalChange } = usePatchSync(
        receiverIdOf(identity),
        state,
        false,
        patchSyncTransformers
    );

	const { inputValue, mode, popupOpen } = currentState;

	const dropdownBoxRef = useRef<HTMLDivElement>(null);

	const stableInputValue = useRef(inputValue);

    // Popup positioning
	const [popupRef,setPopupRef] = useState<HTMLDivElement | null>(null);
	const [popupPos] = usePopupPos(popupRef);

	// Keyboard events sync
	const keyboardActionIdOf = identityAt('keyboardAction');
	const [_, enqueueKeyboardActionPatch] = useSync(keyboardActionIdOf(identity));

	// Interaction with FocusModule (c4e\client\src\extra\focus-module.js) - Excel-style keyboard controls
	function handleCustomDelete(e: CustomEvent) {
		const printableKey = (e.detail && e.detail.key) as string | null;
		sendTempChange({
			inputValue: (printableKey && printableKey !== 'Backspace') ? printableKey : '',
			mode: 'input',
			popupOpen: true
		});
	}

	async function handleClipboardWrite(e: CustomEvent) {
		// On Firefox writing to the clipboard is blocked (available only from user-initiated event callbacks)
		try {
			await navigator.clipboard.writeText(inputValue);
			if (e.type === 'ccut') sendFinalChange({ inputValue: '' });
		} catch(err) {
			console.log(err);
		}
	}

	const customEventHandlers = {
		[ENTER_EVENT]: () => sendFinalChange({ mode: 'input' }),
		[DELETE_EVENT]: handleCustomDelete,
		[BACKSPACE_EVENT]: handleCustomDelete,
		[PASTE_EVENT]: (e: CustomEvent) => sendTempChange({ inputValue: e.detail, mode: 'input', popupOpen: true }),
		[COPY_EVENT]: handleClipboardWrite,
		[CUT_EVENT]: handleClipboardWrite
	};

	useExternalKeyboardControls(dropdownBoxRef.current, customEventHandlers);

	// Event handlers
	function handleBlur(e: React.FocusEvent) {
		if (isInstanceOfNode(e.relatedTarget) && e.currentTarget.contains(e.relatedTarget)) return;
		stableInputValue.current = inputValue;
		sendFinalChange({ mode: 'content', popupOpen: false });
	}

	function handleBoxKeyDown(e: React.KeyboardEvent) {
		switch(e.key) {
			case ARROW_DOWN_KEY:
				if (!popupOpen) {
					e.stopPropagation();
					sendFinalChange({ popupOpen: true });
					break;
				}
				// fall through
			case ENTER_KEY:
				if (!popupOpen) {
					e.stopPropagation();
					e.currentTarget.dispatchEvent(new CustomEvent(TAB_EVENT, { bubbles: true }));
					break;
				}
				// fall through
			case ARROW_UP_KEY:
				if (popupOpen) {
					e.stopPropagation();
					e.preventDefault();
					enqueueKeyboardActionPatch({value: e.key});
				}
				break;
			case ESCAPE_KEY:
				if (mode === 'content' && popupOpen) sendFinalChange({ popupOpen: false });
				else if (mode === 'input') sendFinalChange({ 
					inputValue: stableInputValue.current,
					popupOpen: false,
					mode: inputValue === stableInputValue.current ? 'content' : 'input'
				});
		}
	}

	// Custom content JSX
	const customContent = content.map((item, i) =>
		<span
			className={isChip(item) ? 'chipItem' : undefined}
			style={{ backgroundColor: (item as Chip).bgColor, color: (item as Chip).textColor }}
			key={item.text + i}>
			{item.text}
		</span>
	);

	if (ro) {
		return (
			<div className='customDropdownBox customDropdownRo' >
				<div className="customContentBox">{customContent}</div>
			</div>
		);
	}

	return (
		<div
			className='customDropdownBox'
			tabIndex={1}
			ref={dropdownBoxRef}
			onBlur={handleBlur}
			onKeyDown={handleBoxKeyDown} >

			{mode === 'content' &&
				<div
					className="customContentBox"
					tabIndex={-1}
					onFocus={() => {sendFinalChange({ mode: 'input' })}}>
					{customContent}
				</div>}

			{mode === 'input' &&
				<input 
					type='text' 
					value={inputValue} 
					autoFocus 
					onChange={(e) => sendFinalChange({inputValue: e.target.value, ...(!popupOpen && {popupOpen: true})})}
				/>}

			<button 
				type='button' 
				className='buttonEl' 
				tabIndex={-1} 
				onClick={() => sendFinalChange({ popupOpen: !popupOpen })} 
				onKeyDown={(e) => e.preventDefault()} >
				<img 
					className={clsx(popupOpen && 'rotate180deg')} 
					src='/mod/main/ee/cone/core/ui/c4view/arrow-down.svg'
					alt='arrow-down-icon' />
			</button>

			{children}

			{popupOpen &&
				<div
					ref={setPopupRef}
					className={clsx('popupEl', 'dropdownPopup', popupClassname)}
					style={popupPos} >
					{popupChildren}
				</div>}
		</div>
	);
}

// Server sync functionality
interface DropdownChange {
    inputValue?: string,
	mode?: Mode,
	popupOpen?: boolean
}

interface DropdownPatchHeaders {
	'x-r-inputValue'?: string,
	'x-r-mode'?: Mode,
	'x-r-popupOpen'?: string
}

function serverToState(s: DropdownState): DropdownState {
	return s;
}

function changeToPatch(change: DropdownChange): Patch {
	const { inputValue, mode, popupOpen } = change;
	const headers = {
		...(inputValue !== undefined && {'x-r-inputValue': inputValue}),
		...(mode && {'x-r-mode': mode}),
		...('popupOpen' in change && {'x-r-popupOpen': popupOpen ? '1' : ''})
	};
	return { value: '', headers };
}

function patchToChange(patch: Patch): DropdownChange {
	const headers = patch.headers as DropdownPatchHeaders;
	const { 
		'x-r-inputValue': inputValue, 
		'x-r-mode': mode, 
		'x-r-popupOpen': popupOpenString 
	}: DropdownPatchHeaders = headers!;
	return {
		...('x-r-inputValue' in headers && { inputValue }),
		...(mode && { mode }),
		...('x-r-popupOpen' in headers && {popupOpen: !!popupOpenString})
	};
}

function applyChange(prevState: DropdownState, ch: DropdownChange): DropdownState {
	return { ...prevState, ...ch };
}
