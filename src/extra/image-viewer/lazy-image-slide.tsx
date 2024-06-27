import React, { useState } from "react";
import { RenderSlideProps, ImageSlide, SlideImage, useLightboxState, LoadingIcon, ErrorIcon } from "yet-another-react-lightbox";
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

    const [error, setError] = useState(false);
    const onError = () => {
        setError(true);
        onLoad(slide.src);
    }

    if (error) return <ErrorIcon className="yarl__icon yarl__slide_error" />;

    if (isLoaded(slide.src) || offset === 0 || (Math.abs(offset) <= 2 && arePrioritySlidesLoaded())) {
        // @ts-ignore
        return <ImageSlide slide={slide} offset={offset} {...rest} imageProps={{ onError }} onLoad={() => onLoad(slide.src)} />;
    }
    return <LoadingIcon className='yarl__icon yarl__slide_loading' />
}

export { LazyImageSlide }