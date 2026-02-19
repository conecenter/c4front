import React, { useEffect, useRef } from 'react';

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

/**
 * @unsafe
 * If element is a ref, changes to ref.current won't re-trigger the effect.
 * Do not pass ref.current directly.
 * Unsafe if ref setting is delayed by conditional render or wrapper like Tooltip.
 */
function useExternalKeyboardControls(
	element: React.RefObject<HTMLElement | null> | HTMLElement | null,
	keyboardEventHandlers: KeyboardEventHandlers,
	options?: { capture?: boolean }
) {
	const savedHandlers = useRef(keyboardEventHandlers);

    useEffect(() => {
		savedHandlers.current = keyboardEventHandlers;
	}, [keyboardEventHandlers]);

	useEffect(() => {
		const targetEl = element && 'current' in element ? element.current : element;
		if (!targetEl) return;
		const cEventNames = Object.keys(savedHandlers.current) as KeyboardEventNames[];
		cEventNames.forEach(event => {
			targetEl.addEventListener(event, (e) => savedHandlers.current[event](e), options?.capture)
		});
		return () => cEventNames.forEach(event => {
			targetEl.removeEventListener(event, (e) => savedHandlers.current[event](e), options?.capture)
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