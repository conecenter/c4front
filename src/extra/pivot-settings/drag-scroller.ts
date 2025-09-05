import { createElement as $, useMemo, useRef } from "react";
import { useDragLayer } from "react-dnd";
import { useAnimationFrame } from "../../main/vdom-hooks";
import { useLatest } from "../custom-hooks";

const SCROLL_ZONE = 60;
const SCROLL_SPEED = 10;

function DragScroller() {
    const ref = useRef<HTMLDivElement | null>(null);

    const { isDragging, clientOffset } = useDragLayer((monitor) => ({
        isDragging: monitor.isDragging(),
        clientOffset: monitor.getClientOffset(),
    }));

    const checkApplyScroll = useLatest(() => {
        const win = ref.current?.ownerDocument.defaultView;
        if (!clientOffset || !win) return;

        const { y } = clientOffset;
        const { innerHeight } = win;

        if (y < SCROLL_ZONE) win.scrollBy(0, -SCROLL_SPEED);
        else if (y > innerHeight - SCROLL_ZONE) win.scrollBy(0, SCROLL_SPEED);
    });

    const callback = useMemo(
        () => isDragging ? checkApplyScroll : null,
        [isDragging]
    );
    useAnimationFrame(ref.current, callback?.current);

    return $('div', { ref, style: { display: 'none' }});
}

export { DragScroller }