import { getActiveFocusWrapper, getFocusableNodes } from "../focus-control";
import { useAddEventListener } from "../custom-hooks";

function useFocusTrap(
    rootElem: Element | Document | null,
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
        if (!rootElem || target.className.includes("public-DraftEditor-content")) return;
        const doc = rootElem.ownerDocument || rootElem;
        const cNode = getActiveFocusWrapper(doc);
        const focusableNodes = getFocusableNodes(rootElem);
        if (!cNode) {
            return focusableNodes[0]?.focus();
        }
        const cIndex = focusableNodes.findIndex(node => node == cNode);
        const nextIndex = (cIndex + 1) % focusableNodes.length;
        const nextElem = focusableNodes[nextIndex];
        (nextElem || cNode).focus();
    }

    const enabledRoot = disable ? null : rootElem;

    useAddEventListener(enabledRoot, 'keydown', onKeyDown);
    useAddEventListener(enabledRoot, 'cTab', onTab);
}

export { useFocusTrap }