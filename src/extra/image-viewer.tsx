import React from "react";
import Lightbox, { SlideImage } from "yet-another-react-lightbox";
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
        />
    );
}

export {ImageViewer}