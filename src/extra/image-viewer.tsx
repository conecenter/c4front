import React, { useState } from "react";
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

function ImageViewer({identity, open, slides = []}: ImageViewer) {
    const [bodyRef, setBodyRef] = useState<HTMLElement>();
    const [_, enqueuePatch] = useSync(identity);
    return (
        <div ref={elem => setBodyRef(elem?.ownerDocument.body)} className="imageViewerBox">
            <Lightbox
                open={open}
                close={() => enqueuePatch(PATCH)}
                slides={slides}
                portal={{ root: bodyRef }}
                render={{
                    buttonPrev: slides.length <= 1 ? () => null : undefined,
                    buttonNext: slides.length <= 1 ? () => null : undefined,
                }}            
                plugins={[Zoom]}
                zoom={{ wheelZoomDistanceFactor: 500, pinchZoomDistanceFactor: 200 }}
                styles={{ container: { backgroundColor: "rgba(0, 0, 0, .8)" } }}
            />
        </div>
    );
}

export {ImageViewer}