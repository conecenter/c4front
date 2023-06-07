import ReactDOM from "react-dom";
import React, {createElement as $, useState} from "react";
import {createSyncProviders} from "../../main/vdom-hooks";
import {ImageViewer} from "../../extra/image-viewer";

function App() {
    const [open, setOpen] = useState(false);

    const slides = [
      { src: "./left.jpg", title: 'Left Side' },
      { src: "./back.jpg", title: 'Back' },
      { src: "./photo.jpg", title: 'Front' }
    ];
    
    const children = (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open Lightbox
        </button>
        
        <ImageViewer key="test" identity={{parent: "test"}} index={1} slides={slides} />
      </>
    );

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