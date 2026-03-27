import { useContext, useEffect } from "react";
import { RootBranchContext } from "../main/vdom-hooks";
import { useAddEventListener } from "./custom-hooks";
import { focusAuto, PathContext } from "./focus-announcer";

/*
- the order of navigation flow: hashchange -> server calculations -> new view (new branch key) -> remount whole tree
- history.state - bus between NavigationEffector and FocusAnnouncer for keeping transition flag - helps to avoid Context with right order of providers, but introduces coupling
*/

const SESSION_STORAGE_KEY = 'visitsState';
const DEFAULT_VISIT_STATE = { focus: '', scroll: 0 };

function NavigationEffector() {
    const { isRoot, branchKey } = useContext(RootBranchContext);

    useEffect(
        function turnOffScrollRestoration() {
            if (history.scrollRestoration) history.scrollRestoration = "manual";
        }, []
    );

    useEffect(
        function restoreVisitState() {
            if (!isRoot || !branchKey) return;
            const storedVisitId = history.state?.visitId as string | undefined;
            const savedVisitState = storedVisitId ? popSessionItem(storedVisitId) : undefined;
            setTimeout(() => {  // without timeout some views are not done rendering
                applyNavEffects(savedVisitState || DEFAULT_VISIT_STATE);
                toggleTransitionFlag(false);
            });
        },
        [isRoot, branchKey]
    );

    useEffect(
        function markLocationAsVisited() {
            if (!isRoot) return;
            const visitId = `${location.href}-${branchKey}`;
            history.replaceState({ ...(history.state || {}), visitId }, '');
        },
        [isRoot, branchKey]
    );

    useSaveVisitState();

    useAddEventListener(isRoot ? window : null, 'hashchange', () => toggleTransitionFlag(true));

    return null;
}

function useSaveVisitState() {
    const { isRoot, branchKey } = useContext(RootBranchContext);
    const focusedPath = useContext(PathContext);

    function storeVisitState(e: HashChangeEvent) {
        const visitId = `${e.oldURL}-${branchKey}`;
        const visitState = {
            [visitId]: {
                focus: focusedPath,
                scroll: Math.round(window.scrollY)
            }
        }
        saveToStorage(visitState);
    }
    useAddEventListener(isRoot ? window : null, 'hashchange', storeVisitState);
}

function applyNavEffects(visitState: { focus: string, scroll: number }) {
    const { focus, scroll } = visitState;
    const focusToSelector = focus ? `[data-path="${focus}"]` : null;
    focusToSelector && focusAuto(document.querySelector<HTMLElement>(focusToSelector));
    window.scrollTo(0, scroll);
}

function toggleTransitionFlag(on: boolean) {
    const { navTransition, ...state } = history.state || {};
    const newState = on ? { ...state, navTransition: true } : state;
    history.replaceState(newState, '');
}

// Session storage helpers
interface VisitsState {
    [x: string]: {
        focus: string;
        scroll: number;
    }
}

function saveToStorage(value: VisitsState) {
    const currentState = getSessionItem<VisitsState>(SESSION_STORAGE_KEY) || {};
    const newState: VisitsState = { ...currentState, ...value };
    try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newState));
    } catch(err) {
        console.warn('Could not update session storage:', err);
    }
}

function popSessionItem(key: string): { focus: string, scroll: number } | undefined {
    const { [key]: item, ...newState } = getSessionItem<VisitsState>(SESSION_STORAGE_KEY) || {};
    if (item) {
        try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newState));
        } catch(err) {
            console.warn('Could not update session storage:', err);
        }
    }
    return item;
}

function getSessionItem<T>(key: string): T | null {
    const item = sessionStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
}

export { NavigationEffector }