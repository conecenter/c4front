
//import { h, render } from 'https://unpkg.com/preact@latest?module'
//import { useEffect,useMemo,useLayoutEffect,useState,useCallback } from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module'
/*
import {useEventListener} from "../main/vdom-hooks.js"

const docToSize = document => {
    const documentElement = document.documentElement
    const height = documentElement.clientHeight / getFontSize(documentElement)
    const width = documentElement.clientWidth / getFontSize(documentElement)
    return {document,size:{height,width}}
}

const useViewportSizeEm = () => {
    const [state,setState] = useState(null)
    const ref = useCallback(element => element && setState(docToSize(element.ownerDocument)), [setState])
    const document = state && state.document
    const refresh = useCallback(()=>setState(docToSize(document)),[setState,document])
    const win = document && document.defaultView
    useEventListener(win, "resize", refresh)
    return [state && state.size, ref]
}
*/

import ReactDOM from "react-dom"
import React from "react"
const { createElement: $, useState, useCallback, StrictMode } = React
import {range} from "../main/vdom-util.js"
import {useViewportHeightIntEm} from "../main/sizes.js"
import {DashboardRoot} from "../main/dashboard.js"

const card = (key,n) => $("div",{key},range(n).map(i=>"AAAAAAAA").join(" "))

const App = () => {
    const [height,ref] = useViewportHeightIntEm()
    const [theMode,setMode] = useState(0)
    return $("div", {
        ref,
        onClick: ev => setMode(was=>(was+1)%2),
        children: height && $(DashboardRoot,{
            containerHeight: height,
            containerPaddingTop: 1, containerPaddingLeft: 2,
            minColWidth: 10, maxColWidth: 12,
            rowGap: 1, colGap: 1.3,
            minScale: 0.7, // 0.7
            maxScale: 2,
            containerStyle: {
                //border: "1px solid red",
                boxSizing: "border-box",
            },
            boardStyle: {
                //border: "1px solid green",
                boxSizing: "border-box",
            },
            cardStyles: {
                border: "1px solid grey",
                borderRadius: "10px",
                boxSizing: "border-box",
            },
            children: range(theMode==1?1:10).flatMap(n=>{  //0
                const m = n*10
                return [card(m+1,1), card(m+2,1), card(m+3,6), card(m+4,6), card(m+5,1), card(m+6,1)]
            })
        })
    })
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(StrictMode,{},$(App)), containerElement)