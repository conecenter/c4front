import {createContext, createElement as $, ReactNode, useContext, useEffect, useState, useMemo} from "react"
import type {KeyboardEvent, SyntheticEvent} from "react"

interface UserManual {
    has: (umid: string | undefined) => boolean
    getUrl: (umid: string | undefined) => string | null
}

const defaultUserManual: UserManual = {
    has: umid => false,
    getUrl: umid => null
}

const UserManualContext = createContext<UserManual>(defaultUserManual)
UserManualContext.displayName = "UserManualContext"

const useUserManual = (isFocused: boolean | undefined, umid?: string) => {
    const userManual = useContext(UserManualContext);
    const umUrl = isFocused ? userManual.getUrl(umid) : null;
    return getUserManualUtils(umUrl);
}

interface UserManualProviderProps {
    url: string,
    children: ReactNode
}

function UserManualProvider({url, children}: UserManualProviderProps) {
    const [userManualText, setUserManualText] = useState<string>("{}")
    useEffect(() => {
        fetch(url)
            .then(resp => resp.text())
            .then(setUserManualText)
            .catch((reason) => {
                console.log(reason)
                setUserManualText("{}")
            })
    }, [url])
    const providerValue = useMemo(() => {
        const userManual = JSON.parse(userManualText)
        const has = (umid: string | undefined) => umid && umid in userManual ? true : false
        const getUrl = (umid: string | undefined) => umid && umid in userManual ? userManual[umid] : null
        return {has, getUrl}
    }, [userManualText])

    return $(UserManualContext.Provider, {value: providerValue, children})
}

function getUserManualUtils(url: string | null): { button?: ReactNode, onKeyDown?: ((e: KeyboardEvent) => void) } {
    const action = (e: SyntheticEvent) => {
        if (url) {
            e.stopPropagation()
            e.preventDefault()
            window.open(url)
        }
    }
    const keyDown = (e: KeyboardEvent) => {
        if (e.code == "F1") {
            action(e)
        }
    }
    return url ? {button: UserManualButton(action), onKeyDown: keyDown} : {}
}

function UserManualButton(action: (e: SyntheticEvent) => void) {
    return $("div", {
            className: 'umButton',
            onClick: action,
            style: {
                cursor: "pointer",
                width: "0.8em",
                position: "absolute",
                right: "0em",
                top: "-1em",
                zIndex: "150000"
            }
        },
        $("img", { src: '/mod/main/ee/cone/core/ui/c4view/info.svg' })
    )
}

export {UserManualProvider, useUserManual, getUserManualUtils}