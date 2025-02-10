import {createContext, createElement as $, ReactNode, useContext, useEffect, useState, useMemo} from "react"
import type {MouseEvent, KeyboardEvent} from "react"
import {SVGElement} from "../main/image"

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

interface UserManualProviderProps {
    url: string,
    children: ReactNode
}

function UserManualProvider({url, children}: UserManualProviderProps) {
    const [userManualText, setUserManualText] = useState<string>("{}")
    useEffect(() => {
        fetch(url)
            .then(resp => {
                if (!resp.ok) throw new Error('Network response was not OK');
                return resp.text()
        })
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

const useUserManual = (umid?: string) => {
    const userManual = useContext(UserManualContext);
    const umUrl = userManual.getUrl(umid);

    const userManualButton = !umUrl ? null : $(UserManualButton, { url: umUrl });

    const onKeyDown = (e: KeyboardEvent) => {
        if (umUrl && e.code == "F1") {
            e.stopPropagation();
            e.preventDefault();
            window.open(umUrl);
        }
    }

    return { button: userManualButton, onKeyDown };
}

function UserManualButton({ url }: { url: string }) {
    const onClick = (e: MouseEvent | KeyboardEvent) => {
        e.stopPropagation();
        e.preventDefault();
        window.open(url!);
    }

    return !url ? null : (
        $("div", { className: 'umButton', onClick },
            $(SVGElement, { url: '/mod/main/ee/cone/core/ui/c4view/info.svg', className: 'bodyColorCss' })
        )
    );
}

export {UserManualProvider, useUserManual}