import React, { useContext } from "react"
import { NoCaptionContext } from "../main/vdom-hooks"
import "./inputWrapper.scss"
export function InputLabel({ caption, children, wrapperNeeded}) {
    const noCaption = useContext(NoCaptionContext)
    return  <div className="labeledInput expandedInput">
                {!noCaption && <label>{caption}</label>}
                {wrapperNeeded ? 
                <div className="inputBox">
                    <div className="inputSubbox">
                        {children}
                    </div>
                </div>
                : children}
            </div>
}

export const components = {InputLabel}