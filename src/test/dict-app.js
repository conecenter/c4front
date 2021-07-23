
import {useDict,Dict} from "../main/dict.js"

import ReactDOM from "react-dom"
import React from "react"

const { createElement: $ } = React

function Item(){
    const dict = useDict()
    return $("div",{}, dict && dict["test"])
}

function App(){
    return $(Dict,{url:"dict-app.json"},$(Item,{}))
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)
