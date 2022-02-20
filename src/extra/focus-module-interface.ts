import { useEffect } from 'react';

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
	[ENTER_EVENT]?: CustomEventHandler,
	[DELETE_EVENT]?: CustomEventHandler,
	[BACKSPACE_EVENT]?: CustomEventHandler,
	[PASTE_EVENT]?: CustomEventHandler,
	[COPY_EVENT]?: CustomEventHandler,
	[CUT_EVENT]?: CustomEventHandler
}

type KeyboardEventNames = 'enter' | 'delete' | 'backspace' | 'cpaste' | 'ccopy' | 'ccut';

type CustomEventHandler = (e: CustomEvent) => void

function useExternalKeyboardControls(
	ref: React.MutableRefObject<HTMLElement | null>, 
	keyboardEventHandlers: KeyboardEventHandlers
) {
	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		const cEventNames = Object.keys(keyboardEventHandlers) as KeyboardEventNames[];
		cEventNames
			.forEach(event => element.addEventListener(event, keyboardEventHandlers[event] as CustomEventHandler));
		return () => cEventNames
			.forEach(event => element.removeEventListener(event, keyboardEventHandlers[event] as CustomEventHandler));
	});
}

export { useExternalKeyboardControls, ENTER_EVENT, DELETE_EVENT, BACKSPACE_EVENT, PASTE_EVENT, COPY_EVENT, CUT_EVENT, TAB_EVENT };