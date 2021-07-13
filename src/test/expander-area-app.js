
import {ExpanderArea,Expander} from "../main/expander-area.js"

import ReactDOM from "react-dom"
import React from "react"

const { createElement: $, useState } = React


const button = ({caption,...prop}) => $(Expander,{...prop},[
    $("div",{key:"content",style:{
        border: "1px solid blue"
    }},caption||"VVV")
])
const area = ({key,...props}) => $("div",{key,style:{
    border: "1px solid silver"
}},[
    $(ExpanderArea,{key:"area",...props})
])


function App(){
    const [theIsWide,setIsWide] = useState(false)
    return [
        area({
            key: 0,
            expandTo: [
                button({ key: 1, area: "ct", caption: "W", expandTo: [
                    button({ key: 11, area: "lt", expandTo: [
                        button({ key: 111, area: "lt", caption: "AAA" }),
                        button({ key: 112, area: "lt", caption: "AAA" }),
                    ]}),
                    button({ key: 12, area: "ct", expandTo: [
                        button({ key: 121, area: "ct", caption: "AAA" }),
                        button({ key: 122, area: "ct", caption: "AAA" }),
                    ]}),
                    button({ key: 13, area: "rt", expandTo: [
                        button({ key: 131, area: "rt", caption: "AAA" }),
                        button({ key: 132, area: "rt", caption: "AAA" }),
                    ]}),
                    button({ key: 14, area: "rt", expandTo: [
                        button({ key: 141, area: "rt", caption: "BBBBBB" }),
                        button({ key: 142, area: "rt", caption: "BBBBBB" }),
                        button({ key: 143, area: "rt", caption: "BBBBBB" }),
                        button({ key: 144, area: "rt", caption: "BBBBBB" }),
                        button({ key: 145, area: "rt", caption: "BBBBBB" }),
                        button({ key: 146, area: "rt", caption: "BBBBBB" }),
                        button({ key: 147, area: "rt", caption: "BBBBBB" }),
                        button({ key: 148, area: "rt", caption: "BBBBBB" }),
                        button({ key: 149, area: "rt", caption: "BBBBBB" }),
                    ]}),
                ]})
            ]
        }),
        $("hr",{key:"1h"}),
        area({
            key: 1,
            maxLineCount: 2,
            expandTo: [
                button({ key: 1, area: "ct", caption: "W", expandTo: [
                    button({ key: 11, area: "lt", expandOrder: 0, expandTo: [
                        button({ key: 111, area: "lt", caption: "AAA" }),
                        button({ key: 112, area: "lt", caption: "AAA" }),
                    ]}),
                    button({ key: 13, area: "rt", expandOrder: 1, expandTo: [
                        button({ key: 131, area: "rt", caption: "AAA" }),
                        button({ key: 132, area: "rt", caption: "AAA" }),
                        button({ key: 133, area: "rt", caption: "AAA" }),
                        button({ key: 134, area: "rt", caption: "AAA" }),
                    ]}),
                    button({ key: 14, area: "rt", expandOrder: 2, expandTo: [
                        button({ key: 141, area: "rt", caption: "BBB" }),
                        button({ key: 142, area: "rt", caption: "BBBBBB" }),
                        button({ key: 143, area: "rt", caption: "BBBBBB" }),
                        button({ key: 144, area: "rt", caption: "BBBBBB" }),
                        button({ key: 145, area: "rt", caption: theIsWide ? "BBBBBB_BBBBBB":"BBBBBB" }),
                        button({ key: 146, area: "rt", caption: "BBBBBB" }),
                        button({ key: 147, area: "rt", caption: "BBBBBB" }),
                        button({ key: 148, area: "rt", caption: "BBBBBB" }),
                        button({ key: 149, area: "rt", caption: "BBBBBB" }),
                    ]}),
                ]})
            ]
        }),
        $("button",{onClick:ev=>setIsWide(was=>!was)},"wider"),
    ]
}

const containerElement = document.createElement("div")
document.body.appendChild(containerElement)
ReactDOM.render($(App), containerElement)
