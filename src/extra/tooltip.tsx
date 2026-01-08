import React, { ReactElement } from "react";
import { Root, Trigger, Content, Arrow, Portal } from "@radix-ui/react-tooltip";

interface TooltipProps {
	content?: string,
	side?: "bottom" | "top" | "right" | "left",
	children: ReactElement
}

function Tooltip({ content, side = 'bottom', children }: TooltipProps) {
	return !content ? children : (
		<Root>
			<Trigger asChild>
				{children}
			</Trigger>
			<Portal>
				<Content className="tooltipContent" side={side} align="center" sideOffset={3} onClick={(e) => e.stopPropagation()}>
					{content}
					<Arrow className='tooltipArrow' width={11} height={5} />
				</Content>
			</Portal>
		</Root>
	);
}

export { Tooltip }