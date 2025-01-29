import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Lightbox, { ControllerRef, CloseIcon, IconButton, SlideImage, ZoomRef } from "yet-another-react-lightbox";
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
import { identityAt } from "../../main/vdom-util";
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
    position?: 'fullscreen' | 'inline',
    initialZoom?: number
}

// Server exchange
const slideChangeIdOf = identityAt('slideChange');
const serverToState = (s: string) => s;
const changeToPatch = (ch: string) => ({ value: ch });
const patchToChange = (p: Patch) => p.value;
const applyChange = (prev: string, ch: string) => ch || prev;
const patchSyncTransformers = { serverToState, changeToPatch, patchToChange, applyChange };

function ImageViewer({identity, current: state = '', slides = [], position, initialZoom }: ImageViewer) {
    const {currentState: currentSrcId, sendTempChange, sendFinalChange} =
        usePatchSync(slideChangeIdOf(identity), state, false, patchSyncTransformers);

    const controller = useRef<ControllerRef>(null);

    const inlinePos = position === 'inline';

    const slidesJson = JSON.stringify(slides);

    // The lightbox reads this property when it opens and when slides change
    const currentIndex = getCurrentSlideIndex();
    function getCurrentSlideIndex() {
        const index = slides.findIndex(slide => slide.srcId === currentSrcId);
        return index < 0 ? 0 : index;
    }

    const { loadedSlides, isLoaded, registerLoadedImage } = useLoadedSlides(slidesJson);

    const customSlides: CustomSlide[] = useMemo(() => slides.map(slide => isLoaded(slide.src)
        ? { ...slide, ...loadedSlides[slide.src], isLoaded: true } : slide
    ), [slidesJson, loadedSlides]);

    const handleClose = () => {
        controller.current?.close();
        sendFinalChange('');
    }
    const closeButton = !inlinePos && <IconButton key='ACTION_CLOSE' label='Close' icon={CloseIcon} onClick={handleClose} />;

    const onViewChange = ({ index }: { index: number }) => {
        const activeSlide = slides[index];
        if (activeSlide && activeSlide.srcId !== currentSrcId) sendTempChange(slides[index].srcId);
    }

    const zoomRef = useInitialZoom(customSlides, currentIndex, initialZoom);

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
                    maxZoomPixelRatio: 3,
                    ref: zoomRef
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

function useLoadedSlides(slidesJson: string) {
    const [loadedSlides, setLoadedSlides] = useState<LoadedSlidesInfo>({});
    const isLoaded = (src: string) => !!loadedSlides[src];
    const registerLoadedImage = (src: string) => (img?: HTMLImageElement) => {
        const loadedImage = { [src]: { width: img?.naturalWidth, height: img?.naturalHeight } }
        !isLoaded(src) && setLoadedSlides((prev) => ({ ...prev, ...loadedImage }));
    }
    useEffect(
        function clearLoadedSlides() {
            setLoadedSlides({});
        }, [slidesJson]
    );
    return { loadedSlides, isLoaded, registerLoadedImage };
}

function useInitialZoom(customSlides: CustomSlide[], currentIndex: number, initialZoom?: number) {
    const zoomRef = useRef<ZoomRef | null>(null);
    const isCurrentSlideLoaded = customSlides[currentIndex]?.isLoaded;
    useEffect(
        function applyInitialZoom() {
            if (initialZoom && isCurrentSlideLoaded) {
                // queueMicrotask allows zoomRef to be fully set up on first load
                queueMicrotask(() => zoomRef?.current?.changeZoom(initialZoom));
            }
        }, [currentIndex, initialZoom, isCurrentSlideLoaded]
    );
    return zoomRef;
}

export type { Slide, CustomSlide }
export { ImageViewer }