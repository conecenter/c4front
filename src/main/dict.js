
import {createElement,useState,useContext,createContext,useEffect} from "react"

const Context = createContext()

export const useDict = () => useContext(Context)

export function Dict({children,url}){
    const [theState,setState] = useState(null)
    useEffect(()=>{
        fetch(url).then(resp=>resp.json()).then(setState)
    },[url])
    return createElement(Context.Provider,{value:theState,children})
}