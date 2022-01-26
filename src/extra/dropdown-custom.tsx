import React, { ReactNode, useState } from "react";
import { usePopupPos } from '../main/popup';
import { Patch, PatchHeaders, useInputSync } from './input-sync';

interface DropdownProps {
	key: string,
	identity: Object,
	state: DropdownServerState,
	content: Content[],
	popupChildren: ReactNode[]
}

interface State {
	inputValue: string,
	mode: Mode
}

type Mode = 'content'|'input';

interface DropdownServerState extends State {
	popupOpen?: string
}

interface DropdownState extends State {
	popupOpen: boolean
}

type Content = Chip | Text;

interface Chip {
	color: string,
	text: string
}

interface Text {
	text: string
}

const isChip = (item: Content): item is Chip => (item as Chip).color !== undefined;

export function DropdownCustom({ identity, state, content, popupChildren }: DropdownProps) {
	console.log('render');

	/*
     * Server sync
  	*/ 
	const {
		currentState, 
		setTempState, 
		setFinalState 
	} = useInputSync(identity, 'receiver', state, false, patchToState, serverToState, stateToPatch);

	const { inputValue, mode, popupOpen } = currentState;

	/*
     * Popup positioning
  	*/ 
	const [popupRef,setPopupRef] = useState<HTMLDivElement | null>(null);
	const [popupPos] = usePopupPos(popupRef);

	/*
     * Event handlers
  	*/ 
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

	function handleClick() {
		setFinalState({ ...currentState, popupOpen: !popupOpen });
	}

  	return (
		// remove style for production!!!
		<div className="customDropdownBox" tabIndex={-1} onBlur={handleBlur} style={{ maxWidth: '300px', margin: '1em' }}>
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
				<input type='text' value={inputValue} autoFocus onChange={handleChange} />}
			<button type='button' className='buttonEl' onClick={handleClick}>
				<img 
					className={popupOpen ? 'rotate180deg' : undefined} 
					src='../test/datepicker/arrow-down.svg'	// change for production
					alt='arrow-down-icon' />
			</button>

			{popupOpen && 
				<div ref={setPopupRef} className='dropdownPopup' style={popupPos}>
					{popupChildren}
				</div>}
		</div>
	);
}

function serverToState(serverState: DropdownServerState) {
	const popupOpen = !!serverState.popupOpen;
	return { ...serverState, popupOpen };
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
  popupOpen: boolean
  mode: string }

- на сервер идут данные:
interface SendPatch {
    headers: {'x-r-popupOpen', 'x-r-changing', 'x-r-mode'}
    value: string
    skipByPath: boolean
    retry: boolean
    defer: boolean }
*/