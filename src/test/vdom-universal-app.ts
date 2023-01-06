import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../main/vdom-hooks";
import { RichTextElement } from "../extra/rich-text-element";

function App() {
    const child = $(RichTextElement, {
        key: "TEST3",
        text: [
            { row: [
                {text: 'def ', color: {tp: 'p', cssClass: 'darkIdeaOrangeTextCssClass'}}, 
                {text: 'keepAlive', color: {tp: 'p', cssClass: 'darkIdeaBeigeTextCssClass'}}, 
                {text: '('}] 
            },
            { row : [
                {text: '\t'},
                {text: 'ProtoDefaultDescription$V_DefaultDescription'}, 
                {text: 'items:'}, 
                {text: '88663', color: {tp: 'p', cssClass: 'darkIdeaLightBlueTextCssClass'}}, 
                {text: ', keys:'},
                {text: '88663', color: {tp: 'p', cssClass: 'darkIdeaLightBlueTextCssClass'}}
            ]}
        ],
        color: {tp: 'p', cssClass: 'darkIdeaBackGroundCssClass'}
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