import ReactDOM from "react-dom";
import React, {createElement as $, useState} from "react";
import {createSyncProviders} from "../../main/vdom-hooks";
import {SecondWindowOpener, SecondWindowComponent, SecondWindowManager} from "../../extra/second-window";
import { ChipElement } from "../../extra/chip/chip";


function App() {    
	const [showContent, setShowContent] = useState(false);
    const children = (
      <SecondWindowManager>
        <h1>Second Window!</h1>

        <SecondWindowComponent>
			<p>Cone Center</p>
			<img src='../images/denmark.svg' style={{ width: '5em' }} />
        </SecondWindowComponent>

        <SecondWindowOpener>
			<ChipElement
				identity={{ key: 'test' }}
				text='Open Second Window'
				color={{ tp: 'p', cssClass: 'primaryColorCss' }} />
		</SecondWindowOpener>
			

		<button onClick={() => setShowContent(true)}>Show content</button>
        {showContent && <SecondWindowComponent>
			<h2>Denmark</h2>
			<img src='../images/denmark.svg' style={{ width: '5em' }} />
		</SecondWindowComponent>}
      </SecondWindowManager>
    );

    const sender = {
        enqueue: (identity: object, patch: object) => console.log(patch),
		ctxToPath: () => '/test'
    }
    const ack: boolean | null = null;
    const branchKey = 'abc';
    const isRoot = true;
    
    return createSyncProviders({sender, ack, branchKey, isRoot, children});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);

ReactDOM.render($(App), containerElement);