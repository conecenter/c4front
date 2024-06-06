import { useEffect, useRef } from 'react';

const ENTER_EVENT = 'enter';
const DELETE_EVENT = 'delete';
const BACKSPACE_EVENT = 'backspace';
const PASTE_EVENT = 'cpaste';
const COPY_EVENT = 'ccopy';
const CUT_EVENT = 'ccut';
const TAB_EVENT = 'cTab';

declare global {
	interface HTMLElementEventMap {
		[ENTER_EVENT]: CustomEvent,
		[DELETE_EVENT]: CustomEvent,
		[BACKSPACE_EVENT]: CustomEvent,
		[PASTE_EVENT]: CustomEvent,
		[COPY_EVENT]: CustomEvent,
		[CUT_EVENT]: CustomEvent
	}
}

interface KeyboardEventHandlers {
	[index: string]: CustomEventHandler
}

type KeyboardEventNames = 'enter' | 'delete' | 'backspace' | 'cpaste' | 'ccopy' | 'ccut';

type CustomEventHandler = (e: CustomEvent) => void

function useExternalKeyboardControls(
	element: HTMLElement | null,
	keyboardEventHandlers: KeyboardEventHandlers,
	options?: { capture?: boolean }
) {
	const savedHandlers = useRef(keyboardEventHandlers);
	
    useEffect(() => {
		savedHandlers.current = keyboardEventHandlers;
	}, [keyboardEventHandlers]);

	useEffect(() => {
		if (!element) return;
		const cEventNames = Object.keys(savedHandlers.current) as KeyboardEventNames[];
		cEventNames.forEach(event => {
			element.addEventListener(event, (e) => savedHandlers.current[event](e), options?.capture)
		});
		return () => cEventNames.forEach(event => {
			element.removeEventListener(event, (e) => savedHandlers.current[event](e), options?.capture)
		});
	}, [element]);
}

export {
	useExternalKeyboardControls,
	ENTER_EVENT, 
	DELETE_EVENT, 
	BACKSPACE_EVENT, 
	PASTE_EVENT, 
	COPY_EVENT, 
	CUT_EVENT, 
	TAB_EVENT
};

export type { KeyboardEventNames };