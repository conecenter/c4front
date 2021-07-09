
import ReactDOM from "react-dom"
import React from "react"

const { createElement: $, useCallback, useLayoutEffect, useState } = React

const ExtraEvalExample = ()=>{
    /**
    render function is evaluated 3 times,
    but result of the last call is thrown away and useLayoutEffect not called,
    because react async-ly understands last setState was noop

    https://stackoverflow.com/questions/52624612/does-react-re-render-the-component-if-it-receives-the-same-value-in-state
    https://github.com/facebook/react/issues/17474
    **/

    let counter = 0
    return function Parent(){
        counter++
        console.log(`render function evaluating ${counter}`)
        const [theState,setState] = useState(0)
        useLayoutEffect(()=>{
            console.log("effect")
            setState(was=>1)
        })
        return $("div",{},`${theState} ${counter}`)
    }
}

const RefOrderExample = ()=>{
    /**
    order:
        app render, app render end
        child render
        child ref, child LayoutEffect
        app ref, app LayoutEffect
    **/

    function Child({id,upd}){
        console.log(`child ${id} render`)
        useLayoutEffect(()=>{
            console.log(`child ${id} LayoutEffect`)
        })
        const ref = useCallback(el=>{
            console.log(`child ${id} ref ${el}`)
        })
        return $("div",{ref},id)
    }

    return function Parent(){
        console.log(`app render`)
        useLayoutEffect(()=>{
            console.log("app LayoutEffect")
        })
        const ref = useCallback(el=>{
            console.log(`app ref ${el}`)
        })
        const children = [$(Child,{key:1,id:1}),$(Child,{key:2,id:2})]
        const res = $("div",{ref,children})
        console.log("app render end")
        return res
    }
}

const CallbackRefExample = ()=>{
    /** callback ref running in pairs el/null **/
    return function Parent(){
        console.log(`render function evaluating`)
        const [theState,setState] = useState(0)
        const ref = useCallback(el=>{
            console.log(`ref one time ${el}`)
            setState(was=>1)
        },[setState])
        return $("div",{},[
            $("span",{key:1,ref},theState),
            $("span",{key:2,ref:el=>console.log(`ref every time ${el}`)},theState),
        ])
    }
}

const components = {ExtraEvalExample,RefOrderExample,CallbackRefExample}

function App(){
    return [
        $("div",{key:"list"},Object.keys(components).sort().map(key=>(
            $("button",{key,onClick:ev=>{
                location.href = `${location.pathname}?${key}`
            }},key)
        ))),
        ...[components[location.search.substring(1)]].map(c=>c && $(c(),{key:"current"}))
    ]
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)
