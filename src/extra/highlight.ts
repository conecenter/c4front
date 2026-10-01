import { createElement } from "react";
import { HighlightProps } from "types/c4gen.FrontTags";

export function Highlight({ children }: HighlightProps) {
    return createElement("div",
        {className: "highlight", style: {display: "contents"}},
        children
    )
}
