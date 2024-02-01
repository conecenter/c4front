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
import "yet-another-react-lightbox/plugins/thumbnails/thumbnails.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import { Patch, usePatchSync } from "./exchange/patch-sync";

interface Slide {
    srcId: string,
    src: string,
    title?: string
}

interface ImageViewer {
    identity: Object,
    current?: string,
    slides?: Slide[],
    position?: 'fullscreen' | 'inline'
}

// Server exchange
const changeToPatch = (ch: string) => ({ value: ch });
const patchToChange = (p: Patch) => p.value;
const applyChange = (prev: string, ch: string) => ch || prev;

function ImageViewer({identity, current: state = '', slides = [], position }: ImageViewer) {
    const [bodyRef, setBodyRef] = useState<HTMLElement>();

    const {currentState: currentSrcId, sendTempChange, sendFinalChange} =
        usePatchSync(identity, 'slideChange', state, false, s => s, changeToPatch, patchToChange, applyChange);

    // Slides should have stable reference
    const slidesMemo = useMemo(() => slides, [JSON.stringify(slides)]);

    const controller = useRef<ControllerRef>(null);

    const inlinePos = position === 'inline';

    const startingIndexRef = useRef(getCurrentSlideIndex());

    useEffect(
        function onSlideChange() {
            const internalIndex = controller.current?.getLightboxState().currentIndex;
            const currentIndex = getCurrentSlideIndex();
            if (internalIndex !== undefined && internalIndex !== currentIndex) {
                const changed = currentIndex - internalIndex;
                const direction = changed > 0 ? 'next' : 'prev';
                controller.current?.[direction]({count: Math.abs(changed)});
            }
        }, [currentSrcId]
    );

    function getCurrentSlideIndex() {
        const index = slides.findIndex(slide => slide.srcId === currentSrcId);
        return index < 0 ? 0 : index;
    }

    const handleClose = () => {
        controller.current?.close();
        sendFinalChange('');
    }
    const closeButton = !inlinePos && <IconButton key='ACTION_CLOSE' label='Close' icon={CloseIcon} onClick={handleClose} />;

    return (
        <div ref={elem => setBodyRef(elem?.ownerDocument.body)} className={clsx(inlinePos && 'inlineImageViewer')} >
            <Lightbox
                open={true}
                slides={slidesMemo}
                index={startingIndexRef.current}
                carousel={{ finite: true }}
                controller={{ ref: controller }}
                portal={{ root: bodyRef }}
                plugins={[Captions, Counter, Fullscreen, Zoom, Thumbnails, ...inlinePos ? [Inline] : []]}
                thumbnails={{ vignette: false }}
                zoom={{
                    wheelZoomDistanceFactor: 500,
                    pinchZoomDistanceFactor: 200,
                    maxZoomPixelRatio: 3
                }}
                on={{
                    view: ({index}) => sendTempChange(slides[index].srcId)
                }}
                render={{
                    ...slides.length <= 1 && {
                        buttonPrev: () => null,
                        buttonNext: () => null
                    }
                }}
                toolbar={{ buttons: [closeButton] }}
                fullscreen={{ auto: !inlinePos }}
            />
        </div>
    );
}

export {ImageViewer}