import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Lightbox, { ControllerRef, CloseIcon, IconButton } from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions/captions.css";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter/counter.css";
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
    slides?: Slide[],
    position?: 'fullscreen' | 'inline'
}

// Server exchange
const changeToPatch = (ch: string) => ({ value: ch });
const patchToChange = (p: Patch) => p.value;
const applyChange = (prev: number, ch: string) => ch ? +ch : prev;


function ImageViewer({identity, index: state, slides = [], position}: ImageViewer) {
    const [bodyRef, setBodyRef] = useState<HTMLElement>();

    const {currentState: index, sendTempChange, sendFinalChange} = 
        usePatchSync(identity, 'slideChange', state, false, s => s, changeToPatch, patchToChange, applyChange);

    // Slides should have stable reference
    const slidesMemo = useMemo(() => slides, [JSON.stringify(slides)]);

    const controller = useRef<ControllerRef>(null);

    const startingIndexRef = useRef(index);

    const inlinePos = position === 'inline';

    // Slide changes in spy
    useEffect(() => {
        const currentIndex = controller.current?.getLightboxState().currentIndex;
        if (currentIndex !== undefined && currentIndex !== index) {
            const changed = index - currentIndex;
            const direction = changed > 0 ? 'next' : 'prev';
            controller.current?.[direction]({count: Math.abs(changed)});
        }
    }, [index]);

    const handleClose = () => {
        controller.current?.close();
        sendFinalChange('');
    }

    return (
        <div ref={elem => setBodyRef(elem?.ownerDocument.body)} className={clsx(inlinePos && 'inlineImageViewer')} >
            <Lightbox
                open={true}
                slides={slidesMemo}
                index={startingIndexRef.current}
                controller={{ ref: controller }}
                portal={{ root: bodyRef }}
                plugins={[Captions, Counter, Zoom, ...inlinePos ? [Inline] : []]}
                zoom={{
                    wheelZoomDistanceFactor: 500,
                    pinchZoomDistanceFactor: 200,
                    maxZoomPixelRatio: 3
                }}
                on={{
                    view: ({index: next}) => next !== index && sendTempChange(next.toString())
                }}
                render={{
                    buttonPrev: slides.length <= 1 ? () => null : undefined,
                    buttonNext: slides.length <= 1 ? () => null : undefined
                }}
                toolbar={{ buttons: [
                    <IconButton key='ACTION_CLOSE' label='Close' icon={CloseIcon} onClick={handleClose} />
                ]}}
            />
        </div>
    );
}

export {ImageViewer}