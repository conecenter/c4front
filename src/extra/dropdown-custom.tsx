import clsx from 'clsx';
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { ARROW_DOWN_KEY, ARROW_UP_KEY, ENTER_KEY, ESCAPE_KEY } from '../main/keyboard-keys';
import { usePopupPos } from '../main/popup';
import { useSync } from '../main/vdom-hooks';
import { identityAt } from '../main/vdom-util';
import { Patch, PatchHeaders, useInputSync } from './input-sync';

declare global {
	interface HTMLElementEventMap {
	  enter: CustomEvent,
	  delete: CustomEvent,
	  backspace: CustomEvent,
	  cpaste: CustomEvent,
	  ccopy: CustomEvent,
	  ccut: CustomEvent
	}
}

type customEventNames = 'enter' | 'delete' | 'backspace' | 'cpaste' | 'ccopy' | 'ccut';

interface DropdownProps {
	key: string,
	identity: Object,
	state: DropdownState,
	content: Content[],
	popupChildren: ReactNode[],
	ro: boolean,
	popupClassname?: string
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

const isChip = (item: Content): item is Chip => (item as Chip).bgColor !== undefined;

export function DropdownCustom({ identity, state, content, popupChildren, ro, popupClassname }: DropdownProps) {
	console.log('render');

	const {
		currentState, 
		setTempState, 
		setFinalState 
	} = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);

	const { inputValue, mode, popupOpen } = currentState;

	const stableInputValue = useRef(inputValue);

    // Popup positioning
	const [popupRef,setPopupRef] = useState<HTMLDivElement | null>(null);
	const [popupPos] = usePopupPos(popupRef);

	// Keyboard events sync
	const keyboardActionIdOf = identityAt('keyboardAction');
	const [keyboardActionPatches, enqueueKeyboardActionPatch] = (
		useSync(keyboardActionIdOf(identity)) as [Patch[], (patch: Patch) => void]
	);

	// Interaction with FocusModule (c4enterprise\client\src\extra\focus-module.js) - Excel-style keyboard controls
	const dropdownBoxRef = useRef<HTMLDivElement>(null);	
	
	useEffect(() => {
		const dropdownBox = dropdownBoxRef.current;
		if (!dropdownBox || mode !== 'content') return;

		function handleCustomDelete(e: CustomEvent) {
			const printableKey = (e.detail && e.detail.key) as string | null;
			setTempState({ 
				inputValue: (printableKey && printableKey !== 'Backspace') ? printableKey : '',
				mode: 'input',
				popupOpen: true
			});
		}

		async function handleClipboardWrite(e: CustomEvent) {
			// On Firefox writing to the clipboard is blocked (available only from user-initiated event callbacks)
			try {
				await navigator.clipboard.writeText(inputValue);
				if (e.type === 'ccut') setFinalState({ ...currentState, inputValue: '' });
			} catch(err) {
				console.log(err);
			}
		}

		const customEventHandlers = {
			enter: () => setFinalState({ ...currentState, mode: 'input' }),
			delete: handleCustomDelete,
			backspace: handleCustomDelete,
			cpaste: (e: CustomEvent) => setTempState({ inputValue: e.detail, mode: 'input', popupOpen: true }),
			ccopy: handleClipboardWrite,
			ccut: handleClipboardWrite
		};
		
		const cEventNames = Object.keys(customEventHandlers) as customEventNames[];
		cEventNames.forEach(event => dropdownBox.addEventListener(event, customEventHandlers[event]));

		return () => cEventNames.forEach(event => dropdownBox.removeEventListener(event, customEventHandlers[event]));
	}, [currentState, setTempState, setFinalState]);

	// Event handlers
	function handleBlur(e: React.FocusEvent) {
		if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
		stableInputValue.current = inputValue;
		setFinalState({ inputValue, mode: 'content', popupOpen: false });
	}

	function handleBoxKeyDown(e: React.KeyboardEvent) {
		switch(e.key) {
			case ARROW_DOWN_KEY:
				if (!popupOpen) {
					e.stopPropagation();
					setFinalState({ ...currentState, popupOpen: true });
					break;
				}
			case ENTER_KEY:
				if (!popupOpen) {
					e.stopPropagation();
					e.currentTarget.dispatchEvent(new CustomEvent("cTab", { bubbles: true }));
					break;
				}
			case ARROW_UP_KEY:
				if (popupOpen) {
					e.stopPropagation();
					e.preventDefault();
					enqueueKeyboardActionPatch({value: e.key});
				}
				break;
			case ESCAPE_KEY:
				if (mode === 'content' && popupOpen) setFinalState({ ...currentState, popupOpen: false });
				else if (mode === 'input') setFinalState({ 
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
			<div className='customDropdownBox customDropdownRo' style={{ maxWidth: '300px', margin: '1em' }}>
				<div className="customContentBox">{customContent}</div>
			</div>
		);
	}

  	return (
		// remove style for production!!!
		<div 
			className='customDropdownBox' 
			tabIndex={1}
			ref={dropdownBoxRef}
			onBlur={handleBlur}
			onKeyDown={handleBoxKeyDown}
			style={{ maxWidth: '300px', margin: '1em' }}>

			{mode === 'content' && 
				<div 
					className="customContentBox" 
					tabIndex={-1}
					onFocus={() => {setFinalState({ ...currentState, mode: 'input' })}}>
					{customContent}
				</div>}

			{mode === 'input' &&
				<input 
					type='text' 
					value={inputValue} 
					autoFocus 
					onChange={(e) => setTempState({ inputValue: e.target.value, mode: 'input', popupOpen: true })} />}

			<button 
				type='button' 
				className='buttonEl' 
				tabIndex={-1} 
				onClick={() => setFinalState({ ...currentState, popupOpen: !popupOpen })} 
				onKeyDown={(e) => e.preventDefault()} >
				<img 
					className={popupOpen ? 'rotate180deg' : undefined} 
					src='../test/datepicker/arrow-down.svg'	// change for production
					alt='arrow-down-icon' />
			</button>

			{popupOpen && 
				<div ref={setPopupRef} className={clsx('dropdownPopup', popupClassname)} style={popupPos}>
					{popupChildren}
				</div>}
		</div>
	);
}

function stateToPatch({inputValue, mode, popupOpen}: DropdownState): Patch {
	const headers = {
		'x-r-mode': mode,
		...(popupOpen && {'x-r-popupOpen': '1'})
	};
	return { value: inputValue, headers };
}

function patchToState(patch: Patch): DropdownState {
	const headers = patch.headers as PatchHeaders;
	return {
		inputValue: patch.value,
		mode: headers['x-r-mode'] as Mode,
		popupOpen: !!headers['x-r-popupOpen']
	};
}