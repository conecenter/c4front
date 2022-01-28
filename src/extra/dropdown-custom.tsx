import clsx from 'clsx';
import React, { ReactNode, useState } from "react";
import { ARROW_DOWN_KEY, ARROW_UP_KEY, ENTER_KEY, ESCAPE_KEY } from '../main/keyboard-keys';
import { usePopupPos } from '../main/popup';
import { useSync } from '../main/vdom-hooks';
import { identityAt } from '../main/vdom-util';
import { Patch, PatchHeaders, useInputSync } from './input-sync';

interface DropdownProps {
	key: string,
	identity: Object,
	state: DropdownState,
	content: Content[],
	popupChildren: ReactNode[]
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
	color: string,
	text: string
}

interface Text {
	text: string
}

const isChip = (item: Content): item is Chip => (item as Chip).color !== undefined;

type EnqueueKeyboardActionPatch = {  
	(arg: object): void;
}; 

export function DropdownCustom({ identity, state, content, popupChildren, popupClassname }: DropdownProps) {
	console.log('render');

    // Server sync
	const {
		currentState, 
		setTempState, 
		setFinalState 
	} = useInputSync(identity, 'receiver', state, false, patchToState, s => s, stateToPatch);

	const { inputValue, mode, popupOpen } = currentState;

    // Popup positioning
	const [popupRef,setPopupRef] = useState<HTMLDivElement | null>(null);
	const [popupPos] = usePopupPos(popupRef);

	// Keyboard events sync
	const keyboardActionIdOf = identityAt('keyboardAction');
	const [keyboardActionPatches, enqueueKeyboardActionPatch ] = useSync(keyboardActionIdOf(identity));

	// Event handlers
	function handleBlur(e: React.FocusEvent) {
		if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
		setFinalState({ inputValue, mode: 'content', popupOpen: false });
	}

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		setTempState({
			inputValue: e.target.value,
			mode: 'input',
			popupOpen: true
		});
	}

	function handleBoxKeyDown(e: React.KeyboardEvent) {
		switch(e.key) {
			case ARROW_DOWN_KEY:
				if (!popupOpen) {
					e.stopPropagation();
					setFinalState({ ...currentState, popupOpen: true });
					break;
				}
			case ARROW_UP_KEY:
			case ENTER_KEY:
				if (popupOpen) {
					e.stopPropagation();
					e.preventDefault();
					(enqueueKeyboardActionPatch as EnqueueKeyboardActionPatch)({value: e.key});
				}
				break;
			case ESCAPE_KEY:
				setFinalState({ ...currentState, popupOpen: false });
				break;
		}
	}

	function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (!popupOpen && e.key === ENTER_KEY) e.currentTarget.blur();
	}

  	return (
		// remove style for production!!!
		<div 
			className="customDropdownBox" 
			tabIndex={-1} 
			onBlur={handleBlur}
			onKeyDown={handleBoxKeyDown}
			style={{ maxWidth: '300px', margin: '1em' }}>
			{mode === 'content' && 
				<div className="customContentBox" tabIndex={-1} onFocus={() => setFinalState({ ...currentState, mode: 'input' })}>
					{content.map((item, i) =>
						<span 
							className={isChip(item) ? 'chipItem' : undefined}
							style={{backgroundColor: (item as any).color}}
							key={item.text + i}>
							{item.text}
						</span>
					)}
				</div>}
			{mode === 'input' &&
				<input type='text' value={inputValue} autoFocus onChange={handleChange} onKeyDown={handleInputKeyDown} />}
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

/*
- от сервера приходят данные:
{ key
  identity
  text: string
  inputContent: List[Content]
  popupChildren: ReactNode[]
  popupClassname?: string
  popupOpen: boolean
  mode: string 
}

- на сервер идут данные:
interface SendPatch {
    headers: {'x-r-popupOpen', 'x-r-changing', 'x-r-mode'}
    value: string
    skipByPath: boolean
    retry: boolean
    defer: boolean
}
*/