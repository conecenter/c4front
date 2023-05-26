import React from "react";
import Lightbox, { SlideImage } from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import { useSync } from "../main/vdom-hooks";

const PATCH = { value: '', headers: { "x-r-close": "1" }, skipByPath: false, retry: true };

interface ImageViewer {
    key: string,
    identity: Object,
    open: boolean,
    slides?: SlideImage[]  // should be stable reference
}

function ImageViewer({identity, open, slides}: ImageViewer) {
    const [_, enqueuePatch] = useSync(identity);
    return (
        <Lightbox
            open={open}
            close={() => enqueuePatch(PATCH)}
            slides={slides}
            plugins={[Zoom]}
            zoom={{wheelZoomDistanceFactor: 500, pinchZoomDistanceFactor: 200}}
        />
    );
}

export {ImageViewer}