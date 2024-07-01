import React from "react";
import { RenderSlideProps, ImageSlide, SlideImage, useLightboxState, LoadingIcon } from "yet-another-react-lightbox";
import { clamp } from "../utils";

interface LazyImageSlide extends RenderSlideProps<SlideImage> {
    isLoaded: (src: string) => boolean,
    onLoad: (src: string) => false | void
}

function LazyImageSlide({ slide, offset, isLoaded, onLoad, ...rest }: LazyImageSlide) {
    const { currentIndex: index, slides } = useLightboxState();

    function arePrioritySlidesLoaded() {
        const getSlide = (ind: number) => slides[clamp(ind, 0, slides.length - 1)];
        const prioritySlideIndexes = [index - Math.abs(offset) + 1, index + Math.abs(offset) - 1];
        return prioritySlideIndexes.every(index => isLoaded(getSlide(index).src));
    }

    const markImageLoaded = () => onLoad(slide.src);

    return isLoaded(slide.src) || offset === 0 || (Math.abs(offset) <= 2 && arePrioritySlidesLoaded())
        ? <ImageSlide slide={slide} offset={offset} {...rest} onError={markImageLoaded} onLoad={markImageLoaded} />
        : <LoadingIcon className='yarl__icon yarl__slide_loading' />
}

export { LazyImageSlide }