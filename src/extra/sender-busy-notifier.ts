import { createElement as $, useContext, useRef, useState } from "react";
import { AckContext, useSender } from "../main/vdom-hooks";
import { useInterval } from "./custom-hooks";
import { OverlayMessage } from "./overlay-manager";

const BUSY_OVERLAY = { id: 'busyFor', priority: 1, message: "Calculating\nPlease wait a moment" };

function SenderBusyNotifier() {
	const [isBusy, setIsBusy] = useState(false)
	const {busyFor} = useSender()
	useInterval(() => setIsBusy(busyFor() > 5000), 500)
	return isBusy ? $(OverlayMessage, BUSY_OVERLAY) : null
}

export { SenderBusyNotifier }