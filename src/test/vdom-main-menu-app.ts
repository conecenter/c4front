import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../main/vdom-hooks";
import { MainMenuBar } from '../extra/main-menu-bar';

function App() {
    const child = $(MainMenuBar, {
        key: "TEST",
        identity: {parent: "test"}
        // state: {
        //     inputValue: '45 LEGB [45 9 6]',
        //     mode: 'content',
        //     popupOpen: false,
        // },
        // content: [
        //     { text: 'LEGB', bgColor: '#43A047', textColor: '#000000' },
        //     { text: 'OPS HAMBURG' },
        //     { text: 'OPS ST.PETERSBURG' },
        //     { text: '45HC', bgColor: '#4db6ac', textColor: '#000000' }
        // ],
        // popupChildren: [
        //     $('p', { key: 'popupChild1' }, 'Hello World'),
        //     $('p', { key: 'popupChild2' }, 'Overlanded'),
        //     $('input', { key: 'popupChild3' })
        // ],
        // ro: false,
        // popupClassname: 'popupClassname'
    });
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch)
    };
    const ack: boolean | null = null;

    return createSyncProviders({sender, ack, children: child});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);
ReactDOM.render($(App), containerElement);