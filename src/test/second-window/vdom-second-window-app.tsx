import ReactDOM from "react-dom";
import React, {createElement as $} from "react";
import {createSyncProviders} from "../../main/vdom-hooks";
import {SecondWindowButton, SecondWindowComponent, SecondWindowManager} from "../../extra/second-window";

function App() {    
    const children = (
      <SecondWindowManager>
        <h1>Second Window!</h1>
        <SecondWindowComponent>
          <p>Cone Center</p>
        </SecondWindowComponent>

        <SecondWindowButton
          value=''
          path='/second-monitor-btn'
          content='Open Second Window'
          className='primaryColorCss' />
      </SecondWindowManager>
    );

    const sender = {
        enqueue: (identity: object, patch: object) => console.log(patch)
    }
    const ack: boolean | null = null;
    const branchKey = 'abc';
    const isRoot = true;
    
    return createSyncProviders({sender, ack, branchKey, isRoot, children});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);

ReactDOM.render($(App), containerElement);