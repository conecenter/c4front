import { MutableRefObject } from "react";
import { getActiveFocusWrapper, getFocusableNodes } from "../focus-control";
import { useAddEventListener } from "../custom-hooks";

function useFocusTrap(
    rootRefOrElem: MutableRefObject<Document | Element | null> | Element | null,
    disable?: boolean
) {
    function onKeyDown(e: KeyboardEvent) {
        if (e.key === "Tab") {
            e.preventDefault();
            e.stopPropagation();
            onTab(e);
        }
    }

    function onTab(e: Event) {
        const target = e.target as Element;
        const root = (rootRefOrElem && 'current' in rootRefOrElem) ? rootRefOrElem.current : rootRefOrElem;
        if (!root || target.className.includes("public-DraftEditor-content")) return;
        const doc = root.ownerDocument || root;
        const cNode = getActiveFocusWrapper(doc);
        const focusableNodes = getFocusableNodes(root);
        if (!cNode) {
            return focusableNodes[0]?.focus();
        }
        const cIndex = focusableNodes.findIndex(node => node == cNode);
        const nextIndex = (cIndex + 1) % focusableNodes.length;
        const nextElem = focusableNodes[nextIndex];
        (nextElem || cNode).focus();
    }

    const enabledRoot = disable ? null : rootRefOrElem;

    useAddEventListener(enabledRoot, 'keydown', onKeyDown);
    useAddEventListener(enabledRoot, 'cTab', onTab);
}

export { useFocusTrap }