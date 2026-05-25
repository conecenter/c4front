import React, {useEffect, ReactNode, useState, useCallback} from "react";
import {eventManager} from './event-manager';
import {useFocusTrap} from "./hooks/use-focus-trap";
import {useArrowNavigation} from "./hooks/use-arrow-navigation";
import {getActiveFocusWrapper} from "./focus-control";

interface EventHandlersMap {
	[index: string]: (event: any) => void   // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface KeyboardController {
    children?: ReactNode
}

function KeyboardController({ children }: KeyboardController) {
    const [doc, setDoc] = useState<Document | null>(null);
    const setupDoc = useCallback((elem: HTMLDivElement) => setDoc(elem?.ownerDocument), []);

    useFocusTrap(doc);

    useArrowNavigation(doc);

    useEffect(function setupKeyboardClipboardListeners() {
        if (!doc) return;

        function sendEvent(event: () => Event) {
            const cNode = getActiveFocusWrapper(doc);
            if(!cNode) return;
            const controlEl = cNode.querySelector("input") || cNode.querySelector("textarea") || cNode.querySelector("button,.button");
            const innerTab = cNode.querySelector('[tabindex="1"]');
            const cEvent = event();
            const eventTarget = controlEl || innerTab || cNode;
            eventTarget.dispatchEvent(cEvent);
        }

        const onKeyDown = (event: KeyboardEvent) => {
            const vk = event.code == "vk";
            const eventKey = event.key;
            const detail = { key: eventKey, vk };
            switch (eventKey) {
                case "Erase":
                    sendEvent(() => eventManager.create(doc)("erase"));
                    break;
                case "Delete":
                    sendEvent(() => eventManager.create(doc)("delete", { detail: { key: '', vk } }));
                    break;
                case "Backspace":
                    sendEvent(() => eventManager.create(doc)("backspace", { detail }));
                    break;
                case "Clear":
                    sendEvent(() => eventManager.create(doc)("clear"));
                    break;
                case "F1":
                case "F2":
                case "Enter":
                    event.preventDefault();
                    sendEvent(() => eventManager.create(doc)("enter", { detail }));
                    break;
                case " ": {
                    const target = event.target as Element;
                    if(!target.className?.includes("public-DraftEditor-content") && target.tagName !== "INPUT" && target.tagName !== "TEXTAREA")
                        event.preventDefault();
                    break;
                }
                default:
                    if (event.ctrlKey) break;
                    if (isPrintableEventKey(eventKey)) {
                        sendEvent(() => eventManager.create(doc)("delete",{ detail }));
                    }
            }
        }

        const onEnter = (e: CustomEvent) => {
            const detail = e.detail;
            if(!detail) return;
            const marker = `marker-${detail}`;
            const btn = doc.querySelector(`button.${marker}`);
            setTimeout(() => btn?.dispatchEvent(eventManager.create(doc)("click", { bubbles: true })));
        }

        const onPaste = (e: ClipboardEvent) => {
            const data = e.clipboardData?.getData("text");
            sendEvent(() => eventManager.create(doc)("cpaste", { detail: data, bubbles: true }));
        }

        const onCopy = () => sendEvent(() => eventManager.create(doc)("ccopy", { bubbles: true }));

        const onCut = () => sendEvent(() => eventManager.create(doc)("ccut", { bubbles: true }));

        const eventHandlersMap: EventHandlersMap = {
            keydown: onKeyDown,
            copy: onCopy,
            cut: onCut,
            paste: onPaste,
            cEnter: onEnter
        };

        const window = doc.defaultView;
        const eventNames = Object.keys(eventHandlersMap);

        eventNames.forEach(event => window?.addEventListener(event, eventHandlersMap[event]));

		return () => {
            eventNames.forEach(event => window?.removeEventListener(event, eventHandlersMap[event]));
        };
    }, [doc]);

    return (
        <>
            {children}
            <span
                ref={setupDoc}
                style={{display: 'none'}}>
            </span>
        </>
    );
}

function isPrintableEventKey(ch: string) {
    const printableRegex = /^[a-z0-9.,*\/\-+:;&%#@!~? ]$/i; // eslint-disable-line no-useless-escape
    return printableRegex.test(ch);
}

export { KeyboardController };