import React, { ReactElement } from "react";
import { Root, Trigger, Content, Arrow, Portal } from "@radix-ui/react-tooltip";

interface TooltipProps {
	content?: string,
	children: ReactElement
}

function Tooltip({ content, children }: TooltipProps) {
	return !content ? children : (
		<Root>
			<Trigger
				asChild
				onFocus={onFocus}
				onPointerMove={onPointerMove}
			>
				{children}
			</Trigger>
			<Portal>
				<Content className="tooltipContent" side="bottom" align="center" sideOffset={3}>
					{content}
					<Arrow className='tooltipArrow' width={11} height={5} />
				</Content>
			</Portal>
		</Root>
	);
}

function onFocus(e: React.FocusEvent<HTMLButtonElement>) {
	// focus-visible allows tooltip if focus comes from keyboard
	if (!e.currentTarget.contains(e.target) || !e.currentTarget.matches(':focus-visible')) {
		e.preventDefault();
	}
}

function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
	if (!e.currentTarget.contains(e.target as Node)) e.preventDefault();
}

export { Tooltip }