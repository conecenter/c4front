import React, { useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Lightbox, { ControllerRef, CloseIcon, IconButton, SlideImage } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Inline from "yet-another-react-lightbox/plugins/inline";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Download from "yet-another-react-lightbox/plugins/download";
import { Patch, usePatchSync } from "../exchange/patch-sync";
import { Thumbnail, thumbnailsProps } from "./image-viewer-thumbnails";
import { ZipButton } from "./zip-button";
import { LazyImageSlide } from "./lazy-image-slide";
import { Identity } from "../utils";

interface Slide {
    srcId: string,
    src: string,
    title?: string,
    thumbnail?: string
}

interface LoadedSlidesInfo {
    [src: string]: {
        width?: number,
        height?: number
    } | undefined
}

interface CustomSlide extends SlideImage {
    srcId: string,
    title?: string,
    isLoaded?: boolean
}

interface ImageViewer {
    identity: Identity,
    current?: string,
    slides?: Slide[],
    position?: 'fullscreen' | 'inline'
}

// Server exchange
const changeToPatch = (ch: string) => ({ value: ch });
const patchToChange = (p: Patch) => p.value;
const applyChange = (prev: string, ch: string) => ch || prev;

function ImageViewer({identity, current: state = '', slides = [], position }: ImageViewer) {
    const {currentState: currentSrcId, sendTempChange, sendFinalChange} =
        usePatchSync(identity, 'slideChange', state, false, s => s, changeToPatch, patchToChange, applyChange);

    const controller = useRef<ControllerRef>(null);

    const inlinePos = position === 'inline';

    // The lightbox reads this property when it opens and when slides change
    const currentIndex = getCurrentSlideIndex();
    function getCurrentSlideIndex() {
        const index = slides.findIndex(slide => slide.srcId === currentSrcId);
        return index < 0 ? 0 : index;
    }

    const [loadedSlides, setLoadedSlides] = useState<LoadedSlidesInfo>({});
    const isLoaded = (src: string) => !!loadedSlides[src];
    const registerLoadedImage = (src: string) => (img?: HTMLImageElement) => {
        const loadedImage = { [src]: { width: img?.naturalWidth, height: img?.naturalHeight } }
        !isLoaded(src) && setLoadedSlides((prev) => ({ ...prev, ...loadedImage }));
    }

    const customSlides: CustomSlide[] = useMemo(() => slides.map(slide => isLoaded(slide.src)
        ? { ...slide, ...loadedSlides[slide.src], isLoaded: true } : slide
    ), [JSON.stringify(slides), loadedSlides]);

    const handleClose = () => {
        controller.current?.close();
        sendFinalChange('');
    }
    const closeButton = !inlinePos && <IconButton key='ACTION_CLOSE' label='Close' icon={CloseIcon} onClick={handleClose} />;

    const onViewChange = ({ index }: { index: number }) => {
        const activeSlide = slides[index];
        if (activeSlide && activeSlide.srcId !== currentSrcId) sendTempChange(slides[index].srcId);
    }

    const zipButton = <ZipButton key='zip-button' slides={slides} />;

    return (
        <div className={clsx(inlinePos && 'inlineImageViewer')} >
            <Lightbox
                open={true}
                slides={customSlides}
                index={currentIndex}
                carousel={{ finite: true, preload: 10 }}
                controller={{ ref: controller }}
                plugins={[Captions, Counter, Fullscreen, Zoom, Download, Thumbnails, ...inlinePos ? [Inline] : []]}
                thumbnails={thumbnailsProps}
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
                    },
                    slide: (props) => <LazyImageSlide {...props} registerLoadedImage={registerLoadedImage} />,
                    thumbnail: (props) => <Thumbnail {...props} />
                }}
                toolbar={{ buttons: [closeButton, zipButton] }}
                fullscreen={{ auto: !inlinePos }}
            />
        </div>
    );
}

export type { Slide, CustomSlide }
export { ImageViewer }