import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Lightbox, { ControllerRef, CloseIcon, IconButton } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Inline from "yet-another-react-lightbox/plugins/inline";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Download from "yet-another-react-lightbox/plugins/download";
import { Patch, usePatchSync } from "../exchange/patch-sync";
import { ZipButton } from "./zip-button";

interface Slide {
    srcId: string,
    src: string,
    title?: string
}

interface ImageViewer {
    identity: object,
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

    // The lightbox reads this property when it opens and when slides change
    const startingIndex = useMemo(() => getCurrentSlideIndex(), [slidesMemo]);

    useEffect(
        function onServerSlideChange() {
            const lightboxState = controller.current?.getLightboxState();
            if (!lightboxState) return;
            const { currentIndex: lightboxIndex, slides: lightboxSlides } = lightboxState;
            const currentIndex = getCurrentSlideIndex();
            if (lightboxIndex !== currentIndex && lightboxSlides.length === slides.length) {
                const changed = currentIndex - lightboxIndex;
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

    const onViewChange = ({ index }: { index: number }) => {
        const activeSlide = slides[index];
        if (activeSlide && activeSlide.srcId !== currentSrcId) sendTempChange(slides[index].srcId);
    }

    const zipButton = <ZipButton slides={slides} />;

    return (
        <div ref={elem => setBodyRef(elem?.ownerDocument.body)} className={clsx(inlinePos && 'inlineImageViewer')} >
            <Lightbox
                open={true}
                slides={slidesMemo}
                index={startingIndex}
                carousel={{ finite: true, preload: 3 }}
                controller={{ ref: controller }}
                portal={{ root: bodyRef }}
                plugins={[Captions, Counter, Fullscreen, Zoom, Download, Thumbnails, ...inlinePos ? [Inline] : []]}
                thumbnails={{ vignette: false }}
                zoom={{
                    wheelZoomDistanceFactor: 500,
                    pinchZoomDistanceFactor: 200,
                    maxZoomPixelRatio: 3
                }}
                on={{ view: onViewChange }}
                render={{
                    ...slides.length <= 1 && {
                        buttonPrev: () => null,
                        buttonNext: () => null
                    }
                }}
                toolbar={{ buttons: [closeButton, zipButton] }}
                fullscreen={{ auto: !inlinePos }}
            />
        </div>
    );
}

export type { Slide }
export { ImageViewer }