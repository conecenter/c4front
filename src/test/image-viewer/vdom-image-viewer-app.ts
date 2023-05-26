import ReactDOM from "react-dom";
import {createElement as $} from "react";
import {createSyncProviders} from "../../main/vdom-hooks";
import {ImageViewer} from "../../extra/image-viewer";

function App() {
    const children = $(ImageViewer, {
        key: "test",
        identity: {parent: "test"}
    });

    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch)
    }
    const ack: boolean | null = null;
    const isRoot = true;

    return createSyncProviders({sender, ack, isRoot, children});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);

ReactDOM.render($(App), containerElement);