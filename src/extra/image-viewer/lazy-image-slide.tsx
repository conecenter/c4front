import React from "react";
import { RenderSlideProps, ImageSlide, SlideImage, useLightboxState, LoadingIcon } from "yet-another-react-lightbox";
import { CustomSlide } from "./image-viewer";
import { clamp } from "../utils";

interface LazyImageSlide extends RenderSlideProps<SlideImage> {
    registerLoadedImage: (src: string) => (img?: HTMLImageElement) => void
}

function LazyImageSlide({ slide: _slide, offset, registerLoadedImage, ...rest }: LazyImageSlide) {
    const slide = _slide as CustomSlide;
    const { currentIndex: index, slides } = useLightboxState();

    function arePrioritySlidesLoaded() {
        const getSlide = (ind: number) => slides[clamp(ind, 0, slides.length - 1)] as CustomSlide;
        const prioritySlideIndexes = [index - Math.abs(offset) + 1, index + Math.abs(offset) - 1];
        return prioritySlideIndexes.every(index => getSlide(index).isLoaded);
    }

    const onLoad = registerLoadedImage(slide.src);

    return slide.isLoaded || offset === 0 || (Math.abs(offset) <= 2 && arePrioritySlidesLoaded())
        ? <ImageSlide slide={slide} offset={offset} {...rest} onError={onLoad} onLoad={onLoad} />
        : <LoadingIcon className='yarl__icon yarl__slide_loading' />
}

export { LazyImageSlide }