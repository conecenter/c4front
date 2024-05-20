import ReactDOM from "react-dom";
import React, {createElement as $, useState} from "react";
import {createSyncProviders} from "../../main/vdom-hooks";
import {ImageViewer} from "../../extra/image-viewer/image-viewer";

function App() {
    const [boxSize, setBoxSize] = useState('600px')
    const slides = [
        { src: "./left.jpg", title: 'L', srcId: '1' },
        { src: "./back.jpg", title: 'B', srcId: '2' },
        { src: "./left-2.jpg", title: 'C', srcId: '3' },
        { src: "./back-2.jpg", title: 'B', srcId: '4' },
        { src: "./photo.jpg", title: 'photo', srcId: '5' },
        { src: "./photo.jpg", title: 'photo', srcId: '6' },
        { src: "./photo.jpg", title: 'photo', srcId: '7' },
        { src: "./photo.jpg", title: 'photo', srcId: '8' },
        { src: "./photo.jpg", title: 'photo', srcId: '9' },
      ];
    
    const children = (
      <>
        <div style={{ maxWidth: boxSize }}>
          <ImageViewer identity={{parent: "test"}} slides={slides} position="inline" />
        </div>
        <button onClick={() => setBoxSize('800px')} >Change Size</button>
      </>
    );

    const sender = {
        enqueue: (identity: object, patch: any) => console.log(patch)
    }
    const ack: boolean | null = null;
    const branchKey = 'abc';
    const isRoot = true;
    
    return createSyncProviders({sender, ack, branchKey, isRoot, children});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);

ReactDOM.render($(App), containerElement);