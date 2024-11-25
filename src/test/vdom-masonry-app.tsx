import ReactDOM from "react-dom";
import { createElement as $, ReactNode } from "react";
import { createSyncProviders } from "../main/vdom-hooks";
import { MasonryLayout } from "../extra/masonry-layout/masonry-layout";
import { LabeledElement } from "../extra/labeled-element";

interface GridItemProps {
    gridId: string
}
type FlexGroup = GridItemProps & {
    children: ReactNode
}

const FlexGroup = ({ children }: FlexGroup) => (
    $("div", { className: 'groupBox' }, children)
);

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

    const layoutItems = [
        $(FlexGroup, { key: 'aaa', gridId: 'aaa', children: [
            $(LabeledElement, { key: 'a1', label: "Case Time", children: "17/07/2024 15:32" }), 
            $(LabeledElement, { key: 'a2', label: "Number/Marking", children: "33AHD540" }), 
            $(LabeledElement, { key: 'a3', label: "Location", children: "CU_PARK_IMP" }),
            $(LabeledElement, { key: 'a4', label: "Case Time", children: "17/07/2024 15:32" }), 
            $(LabeledElement, { key: 'a5', label: "Number/Marking", children: "33AHD540" }), 
            $(LabeledElement, { key: 'a6', label: "Location", children: "CU_PARK_IMP" })
        ]}),
        $(FlexGroup, { key: 'bbb', gridId: 'bbb', children: [ 
            $(LabeledElement, { key: 'b1', label: "Case Time_1", children: "17/07/2024 15:32" }), 
            $(LabeledElement, { key: 'b2', label: "Number/Marking_1", children: "33AHD540" }), 
            $(LabeledElement, { key: 'b3', label: "Location_1", children: "CU_PARK_IMP" })
        ]}),
        $(FlexGroup, { key: 'ccc', gridId: 'ccc', children: [
            $(LabeledElement, { key: 'c1', label: "Case Time_2", children: "17/07/2024 15:32" }), 
            $(LabeledElement, { key: 'c2', label: "Number/Marking_2", children: "33AHD540" }), 
            $(LabeledElement, { key: 'c3', label: "Location_2", children: "CU_PARK_IMP" })
        ]})
    ];

    const layout = JSON.stringify([
        { i: "aaa", x: 0, y: 0, w: 2, h: 4, static: false },
        { i: "bbb", x: 2, y: 0, w: 2, h: 8, static: false },
        { i: "ccc", x: 4, y: 0, w: 1, h: 8, static: false }
    ]);

    const children = $(MasonryLayout, {
        identity: { parent: "TEST_1" },
        layout
    }, layoutItems);

    return createSyncProviders({sender, ack, isRoot, branchKey: 'abc', children});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);
ReactDOM.render($(App), containerElement);