import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../main/vdom-hooks";
import { ButtonElement } from "../extra/button-element";
import { SplitButton } from "../extra/split-button";
import { PopupManager } from "../extra/popup-elements/popup-manager";

function App() {
    const optionalGroup = [
        $(ButtonElement, {
            value: "",
            path: "/button1",
            content: "Opt button 1",
            color: { tp: 'p', cssClass: 'greenColorCss' },
            onClick: () => console.log('CLICK OPT BUTTON - 1')
        }),
        $(ButtonElement, {
            value: "",
            path: "/button2",
            content: "Opt button 2",
            color: { tp: 'p', cssClass: 'redColorCss' },
            onClick: () => console.log('CLICK OPT BUTTON - 2')
        }),
    ]
    const child_2 = $(PopupManager, {
        identity: { key: '/popupManager' },
        openedPopups: [],
        children:
            $('div', { key: '1', style: { width: 'fit-content', margin: '5em' }},
                $(SplitButton, {
                    identity: { key: 'test' },
                    mainButton: $(ButtonElement, {
                        value: "",
                        path: "/button",
                        content: "Split button",
                        color: { tp: 'p', cssClass: 'primaryColorCss' },
                        onClick: () => console.log('CLICK')
                    }),
                    optionalGroup
                })
            )
        });
    const sender = {
        enqueue: (identity: object, patch: any) => console.log(patch),
        ctxToPath: () => '/test'
    };
    const ack: boolean | null = null;
    const branchKey = 'abc';
    const isRoot = true;

    return createSyncProviders({sender, ack, branchKey, isRoot, children: child_2});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);
ReactDOM.render($(App), containerElement);