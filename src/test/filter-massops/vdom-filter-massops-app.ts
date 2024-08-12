import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import { FilterButtonExpander } from "../../extra/massops/filter-button-expander";
import { MassOp } from "../../extra/massops/filter-massop";
import { PopupManager } from "../../extra/popup-elements/popup-manager";

const IDENTITY_EXPANDER = { key: "expander" };
const IDENTITY_POPUP_MANAGER = { key: "popup-manager" };
const getMassopIdentity = (index: number) => ({ key: `massop_${index}` });

function ctxToPath(ctx: object): string {
    // @ts-ignore
    return !ctx ? "" : ctxToPath(ctx.parent) + (ctx.key ? "/" + ctx.key : "")
}

function App() {
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch),
        ctxToPath
    };
    const ack: boolean | null = null;
    const isRoot = true;

    const optButtons = [
        $(MassOp, { key: 0, identity: getMassopIdentity(0), area: 'lt', nameFolded: 'Copy', name: 'Copy document', color: { tp: 'p', cssClass: 'secondaryColorCss' }, hint: 'Copy', isFolder: true },
            $(MassOp, { key: 2, identity: getMassopIdentity(2), area: 'lt', name: 'Copy gate order', color: { tp: 'p', cssClass: 'yellowColorCss' } }),
            $(MassOp, { key: 3, identity: getMassopIdentity(3), area: 'lt', name: 'Copy document', color: { tp: 'p', cssClass: 'yellowColorCss' }, isFolder: true },
                $(MassOp, { key: 4, identity: getMassopIdentity(4), area: 'lt', name: 'Copy gate order 1', color: { tp: 'p', cssClass: 'yellowColorCss' } }),
                $(MassOp, { key: 5, identity: getMassopIdentity(5), area: 'lt', name: 'Copy gate order 2', color: { tp: 'p', cssClass: 'yellowColorCss' } }),
                $(MassOp, { key: 6, identity: getMassopIdentity(6), area: 'lt', name: 'Copy gate order 3', color: { tp: 'p', cssClass: 'yellowColorCss' } }),
                $(MassOp, { key: 7, identity: getMassopIdentity(7), area: 'lt', name: 'Copy gate order 4', color: { tp: 'p', cssClass: 'yellowColorCss' } }),
            )
        ),
        $(MassOp, {
            key: 1,
            identity: getMassopIdentity(1),
            area: 'lt',
            name: 'Add Job for Correction',
            icon: './excel.svg',
            color: { tp: 'p', cssClass: 'redColorCss' }
        }),
    ];

    const component = (
        $('div', { className: 'filterArea', tabIndex: '1', style: { width: '500px', margin: '2em', display: 'flex' }},
            $(FilterButtonExpander, {
                identity: IDENTITY_EXPANDER, area: 'lt',
                name: 'Create...',
                color: { tp: 'p', cssClass: 'greenColorCss' },
                optButtons
            }),
            // optButtons
        )
    );

    const children = $(PopupManager, {identity: IDENTITY_POPUP_MANAGER, openedPopups: [], children: component});

    return createSyncProviders({sender, ack, isRoot, branchKey: 'abc', children});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);
ReactDOM.render($(App), containerElement);