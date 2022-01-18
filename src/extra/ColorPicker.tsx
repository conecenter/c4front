import React, { useRef, useState } from "react"
import { Patch, useInputSync } from "./input-sync";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { usePopupPos } from "../main/popup";
import { useOnClickAwayListener } from "./datepicker/datepicker-calendar";

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
	 * Closing popup on click outside color picker
	*/
	const inputBoxRef = useRef<HTMLDivElement | null>(null);

	useOnClickAwayListener(popupRef, onClickAway);

	function onClickAway(e: MouseEvent) {
		const target = e.target as Node;
		if (inputBoxRef.current && inputBoxRef.current.contains(target)) return;
		setActive(false);
	}

	return (
		<div ref={inputBoxRef} className="inputBox" style={{margin: '1em', width: '80px'}}>
			<div className="inputSubBox">
				<HexColorInput
					className={active? undefined : 'colorPickerChip'}
					style={active? undefined : {background: currentState}}
					color={currentState}
					onClick={() => setActive(true)}
					onChange={setFinalState} 
					onInput={(e) => {
						if (e.target.value === '#') setFinalState('');
					}} 
					prefixed
				/>
			</div>

			{active && 
				<div ref={setPopupRef} className='colorPickerPopup' style={popupPos} >
					<HexColorPicker color={currentState} onChange={setFinalState} />
				</div>}
		</div>
	)
    // createElement(
    //     "input",
    //     {
    //         type: "color",
    //         style: {
    //             width: '10em',
    //             border: "none",
    //         },
    //         disabled: ro,
    //         value: currentState,
    //         onChange: e => setTempState(e.target.value),
    //         onBlur: e => setFinalState(currentState)
    //     }
    // )
}

export { ColorPicker };