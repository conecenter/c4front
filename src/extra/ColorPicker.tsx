import React, { useState } from "react"
import { Patch, useInputSync } from "./input-sync";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { usePopupPos } from "../main/popup";
import { ENTER_KEY } from "../main/keyboard-keys";

interface ColorPickerProps {
	identity: Object,
	value: string,
	ro: boolean
}

function ColorPicker({identity, value, ro}: ColorPickerProps) {
	
	const { currentState, setFinalState } = useInputSync<string, string>(
		identity,
		'receiver',
		value,
		true,
		(p: Patch) => p.value,
		s => s,
		s => ({value: s})
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
		if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
		setActive(false);
	}

	function handleInput(e: React.FormEvent<HTMLInputElement>) {
		if (['', '#'].includes(e.currentTarget.value)) setFinalState('');
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

	/*
	 * Styling
	*/
	const inputStyle = {
		background: currentState || 'repeating-linear-gradient(45deg, lightgray 0 8%, white 8% 16%)',
		cursor: ro ? 'default' : 'pointer'
	};

	return (
		<div 
			className="inputBox"
			onFocus={() => setActive(true)}
			onBlur={handleBlur} >

			<div className="inputSubBox" >
				<HexColorInput
					className={active? undefined : 'colorPickerChip'}
					style={active? undefined : inputStyle}
					color={currentState}
					onChange={setFinalState} 
					onInput={handleInput}
					onKeyDown={handleKeyDown}
					onFocus={handleInputFocus}
					disabled={ro}
					prefixed />
			</div>

			{active && 
				<div ref={setPopupRef} className='colorPickerPopup' tabIndex={-1} style={popupPos} >
					<HexColorPicker color={currentState} onChange={setFinalState} />
				</div>}
		</div>
	);
}

export { ColorPicker };