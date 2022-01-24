import React, { useState } from "react";

interface DropdownCustomProps {
	key: string,
	identity: Object,
	value: string,
	content: Content[],
	open: boolean
}

type Content = Chip | string;

interface Chip {
	color: string,
	text: string
}

// interface Text {
// 	text: string
// }

const isChip = (item: Content): item is Chip => typeof item === 'object';

export function DropdownCustom({ identity, value, content, open }: DropdownCustomProps) {
	console.log('render');

	const [mode, setMode] = useState<'display'|'input'>('display');

	function handleBlur(e: React.FocusEvent) {
		if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
		setMode('display');
	}

  	return (
		// remove style for production!!!
		<div className="customDropdownBox" tabIndex={-1} onBlur={handleBlur} style={{ maxWidth: '300px', margin: '1em' }}>
			{mode === 'display' && 
				<div className="customContentBox" tabIndex={-1} onFocus={() => setMode('input')}>
					{content.map((item, i) => isChip(item)
						? <span className='chipItem' style={{backgroundColor: item.color}} key={item.text + i}>{item.text}</span>
						: <span key={item + i}>{item}</span>
					)}
				</div>}
			{mode === 'input' &&
				<input type='text' value={value} autoFocus onChange={() => console.log('hi')} />}
			<button type='button' className='buttonEl'>
				<img src='../test/datepicker/arrow-down.svg' alt='arrow-down-icon' />
			</button>
		</div>
	);
}