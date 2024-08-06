import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import { FilterButtonExpander } from "../../extra/filter-massop";
import { PopupManager } from "../../extra/popup-elements/popup-manager";

const IDENTITY_EXPANDER = { parent: "expander" };
const IDENTITY_POPUP_MANAGER = { parent: "popup-manager" };

function App() {
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch),
        ctxToPath: () => '/test'
    };
    const ack: boolean | null = null;
    const isRoot = true;

    const component = (
        $('div', { className: 'filterArea', tabIndex: '1', style: { width: '500px', margin: '2em' }},
            $(FilterButtonExpander, {
                identity: IDENTITY_EXPANDER, area: 'lt',
                name: 'Create...',
                color: { tp: 'p', cssClass: 'greenColorCss' },
                optButtons: []
            })
        )
    );

    const children = $(PopupManager, {identity: IDENTITY_POPUP_MANAGER, openedPopups: [], children: component});

    return createSyncProviders({sender, ack, isRoot, branchKey: 'abc', children});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);
ReactDOM.render($(App), containerElement);