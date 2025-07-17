import { MutableRefObject } from "react";
import { getActiveFocusWrapper, getFocusableNodes } from "../focus-control";
import { useAddEventListener } from "../custom-hooks";

function useFocusTrap(ref: MutableRefObject<Document | Element | null>) {
    function onKeyDown(e: KeyboardEvent) {
        if (e.key === "Tab") {
            e.preventDefault();
            e.stopPropagation();
            onTab(e);
        }
    }

    function onTab(e: Event) {
        const target = e.target as Element;
        const root = ref.current;
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

    useAddEventListener(ref, 'keydown', onKeyDown);
    useAddEventListener(ref, 'cTab', onTab);
}

export { useFocusTrap }