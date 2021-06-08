import {HoverExpander} from "../extra/hover-expander"

import ReactDOM from "react-dom"
import React from "react"

const {createElement: $} = React

function App() {
    return $("div", {style: {display: "flex", justifyContent: "flex-end"}},
        [$("div", {
                key: "outer1", className: "main"
            },
            $(HoverExpander, {key:"test",
                classNames: ["test"], children: $("div", {key: "child", style: {}},
                    $("span", {style: {fontSize: "0.75em"}}, "very shrt text"))
            })),
            $("div", {
                    key: "outer2", className: "main"
                },
                $(HoverExpander, {key:"test",
                    classNames: ["test"], children: $("div", {key: "child", style: {}},
                        $("span", {style: {fontSize: "0.75em"}}, "very long text very long text"))
                })),
            $("div", {
                    key: "outer3", className: "main"
                },
                $(HoverExpander, {key:"test",
                    classNames: ["test"], children: $("div", {key: "child", style: {}},
                        $("span", {style: {fontSize: "0.75em"}}, "very long text very long text"))
                }))]
    )
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)
