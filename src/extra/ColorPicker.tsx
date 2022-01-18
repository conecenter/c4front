import React, { useState } from "react"
import { Patch, useInputSync } from "./input-sync";
import { ChromePicker } from 'react-color';
import { HexColorPicker, HexColorInput } from "react-colorful";
import { usePopupPos } from "../main/popup";

interface ColorPickerProps {
	identity: Object,
	value: string,
	ro: boolean
}

function ColorPicker({identity, value, ro}: ColorPickerProps) {

	console.log('render');

	const {currentState, setTempState, setFinalState} = useInputSync<string, string>(
		identity,
		"receiver",
		value,
		true,
		(p: Patch) => p.value,
		s => s,
		s => ({value: s})
	);

	const [color, setColor] = useState("");

	const [popupRef,setPopupRef] = useState<HTMLDivElement | null>(null);
	const [popupPos] = usePopupPos(popupRef);

	const [popupOpen, setPopupOpen] = useState(false);

	// console.log(currentState)
	return (
		<div className="inputBox" style={{margin: '1em'}}>
			<div className="inputSubBox" onClick={() => setPopupOpen(prevPopupOpen => !prevPopupOpen)}>
				<HexColorInput color={currentState} onChange={setFinalState} onBlur={() => console.log('blur')} prefixed/>
			</div>

			{popupOpen && 
				<div ref={setPopupRef} style={popupPos} >
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

// class ButtonExample extends React.Component {
//     state = {
//       displayColorPicker: false,
//     };
  
//     handleClick = () => {
//       this.setState({ displayColorPicker: !this.state.displayColorPicker })
//     };
  
//     handleClose = () => {
//       this.setState({ displayColorPicker: false })
//     };
  
//     render() {
//       const popover = {
//         position: 'absolute',
//         zIndex: '2',
//       }
//       const cover = {
//         position: 'fixed',
//         top: '0px',
//         right: '0px',
//         bottom: '0px',
//         left: '0px',
//       }
//       return (
//         <div>
//           <button onClick={ this.handleClick }>Pick Color</button>
//           { this.state.displayColorPicker ? <div style={ popover }>
//             <div style={ cover } onClick={ this.handleClose }/>
//             <ChromePicker />
//           </div> : null }
//         </div>
//       )
//     }
//   }