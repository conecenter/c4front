import { createElement as $, useContext, useRef, useState } from "react";
import { AckContext, useSender } from "../main/vdom-hooks";
import { useInterval } from "./custom-hooks";
import { OverlayMessage } from "./overlay-manager";

const BUSY_OVERLAY = { id: 'busyFor', priority: 1, message: "Calculating\nPlease wait a moment" };

function SenderBusyNotifier() {
	const [isBusy, setIsBusy] = useState(false);
	const busyFrom = useRef(0);

	const { isBusy: isSenderBusy } = useSender();
	const ack = useContext(AckContext);

	const checkBusy = () => {
		if (isSenderBusy(ack)) {
			if (!busyFrom.current) busyFrom.current = Date.now();
			else setIsBusy(Date.now() - busyFrom.current > 3000);
		}
		else {
			busyFrom.current = 0;
			setIsBusy(false);
		}
	}
	useInterval(checkBusy, 500);

	return isBusy ? $(OverlayMessage, BUSY_OVERLAY) : null;
}

export { SenderBusyNotifier }