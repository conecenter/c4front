import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../main/vdom-hooks";
import { RichTextElement } from "../extra/rich-text-element";

function App() {
    const child = $(RichTextElement, {
        key: "TEST3",
        text: [
            { row: [
                {key: '0', text: 'def ', color: {tp: 'p', cssClass: 'darkIdeaOrangeTextCssClass'}}, 
                {key: '1', text: 'keepAlive', color: {tp: 'p', cssClass: 'darkIdeaBeigeTextCssClass'}}, 
                {key: '2', text: '('}] 
            },
            { row : [
                {key: '0', text: '\t'},
                {key: '1', text: 'ProtoDefaultDescription$V_DefaultDescription'}, 
                {key: '2', text: 'items:'}, 
                {key: '3', text: '88663', color: {tp: 'p', cssClass: 'darkIdeaLightBlueTextCssClass'}}, 
                {key: '4', text: ', keys:'},
                {key: '5', text: '88663', color: {tp: 'p', cssClass: 'darkIdeaLightBlueTextCssClass'}}
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