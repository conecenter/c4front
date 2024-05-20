import { createElement as $, useContext, useState } from "react";
import { RootBranchContext, useSender } from "../main/vdom-hooks";
import { useInterval } from "./custom-hooks";
import { OverlayMessage } from "./overlay-manager";

const BUSY_OVERLAY = { id: 'busyFor', priority: 1, message: "Calculating\nPlease wait a moment" };

function SenderBusyNotifier() {
	const [isBusy, setIsBusy] = useState(false);

	const { busyFor } = useSender();
	const { branchKey } = useContext(RootBranchContext);

	const checkBusy = () => setIsBusy(busyFor(branchKey) > 3000);
	useInterval(checkBusy, 500);

	return isBusy ? $(OverlayMessage, BUSY_OVERLAY) : null;
}

export { SenderBusyNotifier }