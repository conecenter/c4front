import { createElement as $, useRef } from "react";
import { useFocusControl } from "./focus-control";
import { SVGElement } from "../main/image";
import clsx from "clsx";

interface TextElementProps {
    path: string
    content: string
    className?: string
    highlight?: string
    fontSize?: string
    onClickCopy: boolean
}

function TextElement({ path, content, className, highlight, fontSize, onClickCopy }: TextElementProps) {
    const el = useRef<HTMLElement | null>(null);

    const { focusClass, focusHtml } = useFocusControl(path);
    const classes = clsx(className, focusClass);
    const style = fontSize ? { fontSize: `${fontSize}em` } : undefined;

    function selectC() {
        const win = el.current?.ownerDocument?.defaultView;
        const selection = win?.getSelection();
        if (!selection) return;
        if (selection.rangeCount > 0) selection.removeAllRanges();
        const range = win!.document.createRange();
        range.selectNode(el.current!);
        selection.addRange(range);
        win!.document.execCommand('copy');
        setTimeout(()=> selection.removeAllRanges(), 200);
    }

    const tag = highlight ? "mark" : "span";

    return $(tag, { ref: el, className: classes, style, ...focusHtml },
        content,
        onClickCopy &&
            $('button', { onClick: selectC, title: 'Copy', className: 'copyToClipboardBtn' },
                $(SVGElement, { url: "/mod/main/ee/cone/core/ui/c4view/copy.svg", className: 'textLineSize' }))
    );
}

export { TextElement }