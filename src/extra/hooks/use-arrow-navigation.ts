import { MutableRefObject } from "react";
import { getActiveFocusWrapper, getFocusableNodes } from "../focus-control";
import { useAddEventListener } from "../custom-hooks";
import { findClosestNode } from "../dom-utils";
import { KEY_TO_DIRECTION } from "../../main/keyboard-keys";
import { SEL_FOCUS_FRAME } from "../css-selectors";

// Selectors
const nestedFocusable = `:scope ${SEL_FOCUS_FRAME} ${SEL_FOCUS_FRAME}`;
const labelDescendant = `:scope .labelBox *`;

function useArrowNavigation(ref: MutableRefObject<Document | Element | null>) {
    function onKeyDown(e: KeyboardEvent) {
        if (!ref.current) return;
        switch (e.key) {
            case "ArrowUp":
            case "ArrowDown":
            case "ArrowLeft":
            case "ArrowRight":
                e.stopPropagation();
                findNestedFocusable(findClosestFocusable(e.key, ref.current))?.focus();
        }
    }

    useAddEventListener(ref, 'keydown', onKeyDown);
}

function findClosestFocusable(eventKey: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight", root: Element | Document) {
    const doc = root.ownerDocument || root;
    const aEl = doc.activeElement;
    if(aEl?.className.includes("public-DraftEditor-content") || aEl?.tagName == "INPUT") return;
    const cNode = getActiveFocusWrapper(doc);
    const nodes = getFocusableNodes(root);
    const direction = KEY_TO_DIRECTION[eventKey];
    return findClosestNode(cNode, nodes, direction);
}

function findNestedFocusable(elem?: HTMLElement) {
    if (!elem) return;
    let best = elem;
    let current: HTMLElement | undefined = best;
    const selector = `${SEL_FOCUS_FRAME}:not(${nestedFocusable}, ${labelDescendant})`;
    while (current) {
        const focusablesNextLevel: NodeListOf<HTMLElement> = current.querySelectorAll(selector);
        if (focusablesNextLevel.length > 1) best = focusablesNextLevel[0]!;
        current = focusablesNextLevel[0];
    }
    return best;
}

export { useArrowNavigation }