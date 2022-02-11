import { useEffect } from 'react';

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

interface KeyboardEventHandlers {
	enter?: CustomEventHandler,
	delete?: CustomEventHandler,
	backspace?: CustomEventHandler,
	cpaste?: CustomEventHandler,
	ccopy?: CustomEventHandler,
	ccut?: CustomEventHandler
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
		cEventNames.forEach(event => element.addEventListener(event, keyboardEventHandlers[event] as CustomEventHandler));
		return () => cEventNames.forEach(event => element.removeEventListener(event, keyboardEventHandlers[event] as CustomEventHandler));
	});
}

export { useExternalKeyboardControls };