import React, { useEffect, useRef, useState } from "react";
import Lightbox, { ControllerRef } from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";
import Inline from "yet-another-react-lightbox/plugins/inline";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { Patch, usePatchSync } from "./exchange/patch-sync";

interface Slide {
    src: string,
    title?: string
}

interface ImageViewer {
    key: string,
    identity: Object,
    index: number,
    slides?: Slide[]  // should be stable reference
}

// Server exchange
const changeToPatch = (ch: string) => ({ value: ch });
const patchToChange = (p: Patch) => p.value;


function ImageViewer({identity, index: state, slides = []}: ImageViewer) {
    const [bodyRef, setBodyRef] = useState<HTMLElement>();

    const {currentState: index, sendTempChange, sendFinalChange} = 
        usePatchSync(identity, 'slideChange', state, false, s => s, changeToPatch, patchToChange, (prev, ch) => +ch);

    const controller = useRef<ControllerRef>(null);
    
    const startingIndexRef = useRef(index);

    // Slide changes in spy
    useEffect(() => {
        const currentIndex = controller.current?.getLightboxState().currentIndex;
        if (currentIndex !== undefined && currentIndex !== index) {
            const changed = index - currentIndex;
            const direction = changed > 0 ? 'next' : 'prev';
            controller.current?.[direction]({count: Math.abs(changed)});
        }
    }, [index]);

    return (
        <div ref={elem => setBodyRef(elem?.ownerDocument.body)} className="imageViewerBox">
            <Lightbox
                open={true}
                close={() => sendFinalChange('')}
                slides={slides}
                index={startingIndexRef.current}
                controller={{ref: controller}}
                portal={{ root: bodyRef }}
                plugins={[Captions, Counter, Zoom]}
                zoom={{
                    wheelZoomDistanceFactor: 500,
                    pinchZoomDistanceFactor: 200
                }}
                styles={{
                    container: { backgroundColor: "rgba(0, 0, 0, .8)" }
                }}
                on={{
                    view: ({index: next}) => next !== index && sendTempChange(next.toString())
                }}
                render={{
                    buttonPrev: slides.length <= 1 ? () => null : undefined,
                    buttonNext: slides.length <= 1 ? () => null : undefined,
                }}
                counter={{ 
                    container: { style: { top: "unset", bottom: 0 } }
                }}
            />
        </div>
    );
}

export {ImageViewer}