import { CSSProperties } from "react";
import { Patch, PatchHeaders } from "../exchange/patch-sync";
import { VkState } from "./virtual-keyboard";

// VK positioning styles
interface PositioningStyles {
    [name: string]: CSSProperties
}

const FIXED_STYLES: CSSProperties = {
    position: 'fixed',
    bottom: '0',
    margin: 'auto'
}

const POSITIONING_STYLES: PositioningStyles = {
    bottom: {
        ...FIXED_STYLES,
        right: '0',
        left: '0'
    },
    left: {
        ...FIXED_STYLES,
        left: '0',
        top: '0'
    },
    right: {
        ...FIXED_STYLES,
        right: '0',
        top: '0'
    },
    static: {
        position: 'relative'
    }
}


// VK exchange
type VkChange = KeypressChange | ModeChange | NoAction;

interface KeypressChange {
    tp: 'keypress',
    key: string
}

interface ModeChange {
    tp: 'modeChange',
    vkType: string,
    mode: number
}

interface NoAction {
    tp: "noop"
}

function changeToPatch(ch: VkChange): Patch {
    return {
        value: ch.tp,
        headers: getHeaders(ch)
    };
}

function getHeaders(ch: VkChange): PatchHeaders {
    switch (ch.tp) {
        case "keypress":
            return { "x-r-key": ch.key };
        case "modeChange":
            return { 
                "x-r-vktype": ch.vkType,
                "x-r-mode": ch.mode.toString()
            };
        default:
            return {};
    }
}

function patchToChange(patch: Patch): VkChange {
    const headers = patch.headers as PatchHeaders;
    switch (patch.value) {
        case 'keypress':
            return {
                tp: 'keypress',
                key: headers["x-r-key"]
            };
        case 'modeChange':
            return {
                tp: 'modeChange',
                vkType: headers["x-r-vktype"],
                mode: Number(headers["x-r-mode"])
            };
        default:
            return { tp: 'noop' };
    }
}

function applyChange(prevState: VkState, ch: VkChange): VkState {
    switch (ch.tp) {
        case "modeChange":
            const prevModeInd = prevState?.findIndex(switchedMode => switchedMode.vkType === ch.vkType);
            const newChangedMode = { vkType: ch.vkType, mode: ch.mode };
            return prevModeInd && prevModeInd > -1
                ? [...prevState!].splice(prevModeInd, 1, newChangedMode)
                : [...prevState!, newChangedMode]
        default:
            return prevState;
    }
}

export type { VkChange };
export { POSITIONING_STYLES, changeToPatch, patchToChange, applyChange };