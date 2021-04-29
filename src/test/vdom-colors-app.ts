import ReactDOM from "react-dom"
import React, {useState} from "react"
import chroma from "chroma-js";

const {createElement: el} = React

function App() {
    const [value, setValue] = useState("")
    const currentColor = chroma.valid(value) ? chroma(value) : chroma("#1e88e5")
    const darker = currentColor.darken()
    const darkerr = darker.darken()
    const darkerrr = darkerr.darken()
    const lighter = currentColor.brighten()
    const lighterr = lighter.brighten()
    const lighterrr = lighterr.brighten()

    function coloredDiv(color: chroma.Color) {
        return el("div", {style: {background: color.css(), width: "100%", height: "10em"}},
            el("span", {style:{width: "10em", height: "10em", fontSize: "3em"}}, color.css('hsl') + " " + color.hex())
        )
    }

    return el("div", {}, el("input", {
            value: value,
            onChange: ev => setValue(ev.target.value),
        }),
        coloredDiv(darkerrr),
        coloredDiv(darkerr),
        coloredDiv(darker),
        coloredDiv(currentColor),
        coloredDiv(lighter),
        coloredDiv(lighterr),
        coloredDiv(lighterrr)
    )
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render(el(App), containerElement)