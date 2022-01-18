import React, { useState } from "react"
import { Patch, useInputSync } from "./input-sync";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { usePopupPos } from "../main/popup";

interface ColorPickerProps {
	identity: Object,
	value: string,
	ro: boolean
}

function ColorPicker({identity, value, ro}: ColorPickerProps) {

	console.log('render');

	const { currentState, setTempState, setFinalState } = useInputSync<string, string>(
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
	 * Styling
	*/
	const inputStyle = {
		background: currentState || 'repeating-linear-gradient(45deg, lightgray 0 8%, white 8% 16%)',
		cursor: ro ? 'default' : 'pointer'
	};

	return (
		<div 
			className="inputBox" 
			style={{margin: '1em', width: '80px'}} // remove for production
			onFocus={() => setActive(true)}
			onBlur={() => setActive(false)} >

			<div className="inputSubBox">
				<HexColorInput
					className={active? undefined : 'colorPickerChip'}
					style={active? undefined : inputStyle}
					color={currentState}
					onChange={setFinalState} 
					onInput={(e) => {
						if (e.target.value === '#' || e.target.value === '') setFinalState('');
					}} 
					disabled={ro}
					prefixed />
			</div>

			{active && 
				<div ref={setPopupRef} className='colorPickerPopup' style={popupPos} >
					<HexColorPicker color={currentState} onChange={setFinalState} />
				</div>}
		</div>
	);
}

export { ColorPicker };