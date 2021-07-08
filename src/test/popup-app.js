
import {usePopupPos} from "../main/popup.js"

import ReactDOM from "react-dom"
import React from "react"

const { createElement: $, useState } = React

const modeOpt = (pos,theVal,setVal,val,text) => $("button",{
    key: "pos"+pos,
    onClick: ev => setVal(val),
    style: {
        border: "1px solid black",
        backgroundColor: val===theVal ? "yellow" : "silver",
        position: "fixed",
        top: (pos*2)+"em"
    }
},text)

function App(){
    const [theElement,setElement] = useState(null)
    const [theLRMode,setLRMode] = useState(false)
    const [pos] = usePopupPos(theElement,theLRMode)
    const [theWidth,setWidth] = useState(200)
    const [theHeight,setHeight] = useState(50)
    return $("div",{
        style: { width: "1000px", height: "1000px", border: "1px solid silver"}
    },[
        modeOpt(1,theLRMode,setLRMode,false,"up/down"),
        modeOpt(2,theLRMode,setLRMode,true,"left/right"),
        modeOpt(3,theWidth,setWidth,50,"width 50"),
        modeOpt(4,theWidth,setWidth,200,"width 200"),
        modeOpt(5,theHeight,setHeight,50,"height 50"),
        modeOpt(6,theHeight,setHeight,400,"height 400"),
        $("div",{
            key: "parent",
            style: { width: "100px", height: "50px", position: "absolute", top: "500px", left: "500px", border: "1px solid blue"},
        },[
            $("div",{
                key: "popup",
                ref: setElement,
                style: {
                    ...pos,
                    width: theWidth, height: theHeight,
                    maxHeight: "90vh", boxSizing: "border-box",
                    border: "1px solid red",
                }
            },"POPUP")
        ])
    ])
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)
