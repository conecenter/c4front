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

interface PopupPosition { 
    position: 'fixed', 
    top: number,
    left: number, 
    visibility?: 'hidden', 
    width?: number, 
    minWidth?: number
};

interface CustomEventHandlers {
	enter: CustomEventHandler,
	delete: CustomEventHandler,
	backspace: CustomEventHandler,
	cpaste: CustomEventHandler,
	ccopy: CustomEventHandler,
	ccut: CustomEventHandler
}

type CustomEventNames = 'enter' | 'delete' | 'backspace' | 'cpaste' | 'ccopy' | 'ccut';

type CustomEventHandler = (e: CustomEvent) => void

export type { PopupPosition, CustomEventNames, CustomEventHandlers };