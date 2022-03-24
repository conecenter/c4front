import { Patch, PatchHeaders } from '../input-sync';
import { MenuItemState } from './main-menu-bar';

// Server sync functionality

function patchToState(patch: Patch): MenuItemState {
    const headers = patch.headers as PatchHeaders;
	return { opened: !!headers['x-r-opened'] };
}

function stateToPatch({ opened }: MenuItemState): Patch {
	const headers = { 'x-r-opened': opened ? '1' : '' };
	return { value: '', headers };
}

// Helper functions

function handleMenuBlur(e: React.FocusEvent, setFinalState: (s: MenuItemState) => void) {
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
    setFinalState({ opened: false });
}

export { patchToState, stateToPatch, handleMenuBlur };