import React from "react";
import { Patch, PatchHeaders, useInputSync } from './input-sync';

interface DropdownProps {
	key: string,
	identity: Object,
	state: DropdownState,
	content: Content[]
}

interface DropdownState {
	inputValue: string,
	mode: Mode,
	open: boolean
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

export function DropdownCustom({ identity, state, content }: DropdownProps) {
	console.log('render');

	const {
		currentState, 
		setTempState, 
		setFinalState 
	} = useInputSync(identity, 'receiver', state, true, patchToState, s => s, stateToPatch);

	const { inputValue, mode, open } = currentState;

	function handleBlur(e: React.FocusEvent) {
		if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
		setFinalState({ ...currentState, mode: 'content' });
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
				<input type='text' value={inputValue} autoFocus onChange={() => console.log('hi')} />}
			<button type='button' className='buttonEl'>
				<img src='../test/datepicker/arrow-down.svg' alt='arrow-down-icon' />
			</button>
		</div>
	);
}

function stateToPatch({inputValue, mode, open}: DropdownState): Patch {
	const headers = {
		'x-r-mode': mode,
		...(open && {'x-r-open': '1'})
	};
	return { value: inputValue, headers };
}

function patchToState(patch: Patch): DropdownState {
	const headers = patch.headers as PatchHeaders;
	return {
		inputValue: patch.value,
		mode: headers['x-r-mode'] as Mode,
		open: !!headers['x-r-open']
	};
}

/*
- от сервера приходят данные:
{ key
  identity
  text: string
  inputContent: List[Content]
  popupChildren: ReactNode[]
  open: boolean
  mode: string }

- на сервер идут данные:
interface SendPatch {
    headers: {'x-r-open', 'x-r-changing', 'x-r-mode'}
    value: string
    skipByPath: boolean
    retry: boolean
    defer: boolean }
*/