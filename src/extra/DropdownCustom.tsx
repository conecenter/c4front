import React from "react";

interface DropdownCustomProps {
	key: string,
	identity: Object,
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

export function DropdownCustom({ identity, content, open }: DropdownCustomProps) {
  	return (
		// remove style for production!!!
		<div className="customDropdownBox" style={{ width: '300px', margin: '1em' }}>
			<div className="customContentBox">
				{content.map(item => isChip(item)
					? <span className='chipItem' style={{backgroundColor: item.color}}>{item.text}</span>
					: <span>{item}</span>
				)}
			</div>
		</div>
	);
}