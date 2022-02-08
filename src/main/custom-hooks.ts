import { useEffect } from 'react';
import { CustomEventHandlers, CustomEventNames } from '../extra/common-types';

function useExternalKeyboardControls(
	ref: React.MutableRefObject<HTMLElement | null>, 
	customEventHandlers: CustomEventHandlers
) {
	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		const cEventNames = Object.keys(customEventHandlers) as CustomEventNames[];
		cEventNames.forEach(event => element.addEventListener(event, customEventHandlers[event]));
		return () => cEventNames.forEach(event => element.removeEventListener(event, customEventHandlers[event]));
	});
}

export { useExternalKeyboardControls };