
import ReactDOM from "react-dom"
import React from "react"

const { createElement: $, useState } = React

import {CamView} from "../main/mjpeg.js"

function App(){
    return [
        $(CamView,{ key: "0", url: "ws://"+location.host+"/mjpeg/test0" }),
        $(CamView,{ key: "1", url: "ws://"+location.host+"/mjpeg/test0" }),
    ]
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)