import {HoverExpander} from "../extra/hover-expander"

import ReactDOM from "react-dom"
import React from "react"
import {ExpandableTableHeader} from "../extra/expandable-table-header";

const {createElement: $} = React

function App() {
    return $("div", {style: {display: "flex", justifyContent: "flex-end", height: "50em"}},
        [$("div", {
                key: "outer1", className: "main"
            },
            $(HoverExpander, {
                key: "test",
                classNames: ["test"], children: $("div", {key: "child", style: {}},
                    $("span", {style: {fontSize: "0.75em"}}, "very shrt text"))
            })),
            $("div", {
                    key: "outer2", className: "main"
                },
                $(HoverExpander, {
                    key: "test",
                    classNames: ["test"], children: $("div", {key: "child", style: {}},
                        $("span", {style: {fontSize: "0.75em"}}, "very long text very long text"))
                })),
            $("div", {
                    key: "header1", className: "main"
                },
                $(ExpandableTableHeader, {
                    key: "test",
                    title: "lonsssssssd",
                    shortTitle: "short",
                    hoverClassNames: ["test"],
                    children: [$("div", {key: "child", style: {}},
                        $("span", {style: {fontSize: "0.75em"}}, "child"))]
                })),
            $("div", {
                    key: "outer3", className: "main", style: {alignSelf: "center"}
                },
                $(HoverExpander, {
                    key: "test",
                    classNames: ["test"], children: $("div", {key: "child", style: {}},
                        $("span", {style: {fontSize: "0.75em"}}, "very long text very long text"))
                }))]
    )
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)
