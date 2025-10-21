import React, {useState} from "react"
import {HexColorInput, HexColorPicker} from "react-colorful";
import {usePopupPos} from "../main/popup";
import {isInstanceOfNode} from "./dom-utils";
import {ENTER_KEY} from "../main/keyboard-keys";
import {identityAt} from "../main/vdom-util";
import { usePatchSync, Patch } from "./exchange/patch-sync";

const receiverIdOf = identityAt('receiver');

const patchSyncTransformers = {
	serverToState: (s: string) => s,
	changeToPatch: (s: string) => ({value: s}),
	patchToChange: (p: Patch) => p.value,
	applyChange: (prev: string, ch: string) => ch
};

interface ColorPickerProps {
	identity: object,
	value: string,
	ro: boolean
}

export function ColorPicker({identity, value, ro}: ColorPickerProps) {
	const { currentState, sendTempChange, sendFinalChange } = usePatchSync(
		receiverIdOf(identity), value, true, patchSyncTransformers
	);

	const [active, setActive] = useState(false);

	/*
	 * Popup positioning
	*/
	const [popupRef,setPopupRef] = useState<HTMLDivElement | null>(null);
	const [popupPos] = usePopupPos(popupRef);

	/*
	 * Event handlers
	*/
	function handleBlur(e: React.FocusEvent) {
		if (isInstanceOfNode(e.relatedTarget) && e.currentTarget.contains(e.relatedTarget)) return;
		sendFinalChange(currentState);
		setActive(false);
	}

	function handleInput(e: React.FormEvent<HTMLInputElement>) {
		if (['', '#'].includes(e.currentTarget.value)) sendTempChange('');
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === ENTER_KEY) e.currentTarget.blur();
	}

	function handleInputFocus(e: React.FocusEvent<HTMLInputElement>) {
		if (!active) {
			const target = e.currentTarget;
			setTimeout(() => target.setSelectionRange(7, 7), 0);
		}
	}

	return (
		<div
			className={`inputBox${ro ? ' colorPickerRo' : ''}`}
			onFocus={() => setActive(true)}
			onBlur={handleBlur} >

			<div className="inputSubBox" >
				<HexColorInput
					className={active? undefined : 'colorPickerChip'}
					style={active? undefined : {background: currentState}}
					color={currentState}
					onChange={sendTempChange}
					onInput={handleInput}
					onKeyDown={handleKeyDown}
					onFocus={handleInputFocus}
					disabled={ro}
					prefixed />
			</div>

			{active &&
				<div ref={setPopupRef} className='colorPickerPopup' tabIndex={-1} style={popupPos} >
					<HexColorPicker color={currentState} onChange={sendTempChange} />
				</div>}
		</div>
	);
}
