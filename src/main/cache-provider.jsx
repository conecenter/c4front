import React, { useEffect, useState, useContext, createContext, useMemo } from 'react'

const defaultContext = { "setRequests": () => { }, "setResponses": () => { }, "responses": {} }

const CacheContext = createContext(defaultContext)

export const useCached = src => {
    const { setRequests, setResponses, responses } = useContext(CacheContext)
    useEffect(() => {
        if (src) setRequests(was => {
            if (was[src]) return was
            fetch(src).then(r => r.text()).then(text => setResponses(was => ({ ...was, [src]: text })))
            return { ...was, [src]: 1 }
        })
    }, [src, setRequests, setResponses])
    return responses[src]
}

export function CacheProviderElement({ children }) {
    const [requests, setRequests] = useState({})
    const [responses, setResponses] = useState({})
    console.log("provider render")
    const value = useMemo(() => ({ setRequests, setResponses, responses }), [setRequests, setResponses, responses])
    return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>
}