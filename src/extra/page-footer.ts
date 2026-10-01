import {createElement} from "react";
import {PageFooterProps} from "types/c4gen.FrontTags";

export function PageFooter({footerKey, children}: PageFooterProps) {
    const className = "bottom-row hideOnScroll pageFooterMain"
    return createElement("div", {className: "pageFooter"},
        [
            createElement("div", {
                key: footerKey,
                className: className,
                "data-path": footerKey
            }, children)
        ])
}