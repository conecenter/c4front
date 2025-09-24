import React, { useContext, useEffect, useRef, useState } from "react";
import { ScrollInfoContext } from "./scroll-info-context";
import { useAddEventListener } from "./custom-hooks";

interface ExternalApplication {
    url?: string,
    hidden?: boolean
}

function ExternalApplication({ url, hidden }: ExternalApplication) {
    const { setFrame, height } = useFrameHeight(hidden);
    const styles = {
        height: `${height}px`,
        ...hidden && { display: 'none' }
    }
    return url
        ? <iframe ref={setFrame} src={url} className='externalApp' style={styles} />
        : null;
}

function useFrameHeight(hidden?: boolean) {
    const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
    const win = frame?.ownerDocument.defaultView;

    const [height, setHeight] = useState(0);
    const { totalSpaceUsed } = useContext(ScrollInfoContext);

    function calcHeight() {
        if (win && !hidden) setHeight(win.innerHeight - totalSpaceUsed);
    }

    useEffect(calcHeight, [totalSpaceUsed, hidden, win]);
    useAddEventListener(win, 'resize', calcHeight);

    return { setFrame, height };
}

export { ExternalApplication }