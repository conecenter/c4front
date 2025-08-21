import ReactDOM from "react-dom";
import { createElement as $, useState } from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import { BottomBarManager } from "../../extra/bottom-bar/bottom-bar-manager";
import { BottomBarElement } from "../../extra/bottom-bar/bottom-bar-element";

function App() {
    const singleChild = [$(BottomBarElement, { id: 'id-0', align: 'c' }, [$('button', { key: '0', onClick: () => setChildren(doubleChild) }, 'Button-0')])]
    const doubleChild = [
        $(BottomBarElement, { id: 'id-0', align: 'l' }, [$('button', { key: '0', onClick: () => setChildren(doubleChild) }, 'Button-0 dsjfljsd dsgjlsdjgjsd gjsdljgljsdlgjsd glsdgsdlgjlsdjsdfsdfsdfsdfsdf')]),
        $(BottomBarElement, { id: 'id-1', priority: 1 }, [$('button', { key: '1', onClick: () => setChildren(singleChild) }, 'Button-1')]),
        $(BottomBarElement, { id: 'id-2', align: 'c' }, [$('button', { key: '2', onClick: () => setChildren(doubleChild) }, 'Button-2')]),
        $(BottomBarElement, { id: 'id-3', align: 'r' }, [$('button', { key: '3', onClick: () => setChildren(doubleChild) }, 'Button-3 dsjfljsd dsgjlsdjgjsd gjsdljgljsdlgjsd glsdgsdlgjlsdjsdfsdfsdfsdfsdf')]),
        $(BottomBarElement, { id: 'id-4', align: 'c' }, [$('button', { key: '4', onClick: () => setChildren(doubleChild) }, 'Button-4 dsjfljsd dsgjlsdjgjsd gjsdljgljsdlgjsd glsdgsdlgjlsdjsdfsdfsdfsdfsdf')]),
    ]
    const [children, setChildren] = useState(doubleChild);
    const child = $(BottomBarManager, null, children);
    const sender = {
        enqueue: (identity: unknown, patch: unknown) => console.log(patch),
        ctxToPath: () => '/test'
    };
    const ack: boolean | null = null;
    const isRoot = true;

    return createSyncProviders({sender, ack, isRoot, branchKey: 'abc', children: child});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);
ReactDOM.render($(App), containerElement);