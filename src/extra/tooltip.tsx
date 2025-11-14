import React, { ReactElement } from "react";
import { Root, Trigger, Content, Arrow, Portal } from "@radix-ui/react-tooltip";

interface TooltipProps {
	content?: string,
	children: ReactElement
}

function Tooltip({ content, children }: TooltipProps) {
	return !content ? children : (
		<Root>
			<Trigger asChild>
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

export { Tooltip }