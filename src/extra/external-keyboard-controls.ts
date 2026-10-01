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
		[CUT_EVENT]: CustomEvent,
		[TAB_EVENT]: CustomEvent
	}
}

type KeyboardEventHandlers = Partial<Record<KeyboardEventNames, CustomEventHandler>>

type KeyboardEventNames =
    | typeof ENTER_EVENT
    | typeof DELETE_EVENT
    | typeof BACKSPACE_EVENT
    | typeof PASTE_EVENT
    | typeof COPY_EVENT
    | typeof CUT_EVENT
	| typeof TAB_EVENT

type CustomEventHandler = (e: CustomEvent) => void

/**
 * @unsafe
 * If element is a ref, changes to ref.current won't re-trigger the effect.
 * Do not pass ref.current directly.
 * Unsafe if ref setting is delayed by conditional render or wrapper like Tooltip.
 */
function useExternalKeyboardControls<T extends KeyboardEventHandlers>(
	element: React.RefObject<HTMLElement | null> | HTMLElement | null,
	keyboardEventHandlers: keyof T extends KeyboardEventNames ? T : never,
	options?: { capture?: boolean }
) {
	const savedHandlers = useRef<KeyboardEventHandlers>(keyboardEventHandlers);
	savedHandlers.current = keyboardEventHandlers;

	useEffect(() => {
		const targetEl = element && 'current' in element ? element.current : element;
		if (!targetEl) return;
		const cEventNames = Object.keys(savedHandlers.current) as KeyboardEventNames[];
		const listeners = cEventNames.map(event => {
			const handler = (e: CustomEvent) => savedHandlers.current[event]?.(e);
			targetEl.addEventListener(event, handler, options?.capture);
			return { event, handler };
		});
		return () => listeners.forEach(({ event, handler }) => {
			targetEl.removeEventListener(event, handler, options?.capture)
		});
	}, [element, options?.capture]);
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