import React, { useCallback, useState } from "react";
import useResizeObserver from '@react-hook/resize-observer';
import { ImageSlide, RenderThumbnailProps } from "yet-another-react-lightbox";
import { Slide } from "./image-viewer";

const THUMBNAILS_GAP = 8;
const THUMBNAILS_WIDTH = 120;
const DEFAULT_THUMBNAILS_NUMBER = 3;
const THUMBNAILS_CONTAINER_SELECTOR = '.yarl__thumbnails_container';

const thumbnailsProps = {
    vignette: false,
    width: THUMBNAILS_WIDTH,
    gap: THUMBNAILS_GAP
}

function useThumbnailsNumber() {
    const [thumbsContainer, setThumbsContainer] = useState<HTMLElement | null>(null);
    const [thumbnailsNumber, setThumbnailsNumber] = useState(DEFAULT_THUMBNAILS_NUMBER);

    const thumbnailWidth = THUMBNAILS_WIDTH + THUMBNAILS_GAP;

    const getThumbsContainer = useCallback((elem: HTMLElement | null) => {
        setThumbsContainer(elem && elem.querySelector<HTMLElement>(THUMBNAILS_CONTAINER_SELECTOR));
    }, []);

    useResizeObserver(thumbsContainer, (entry) => {
        const newThumbsNumber = Math.ceil((entry.borderBoxSize[0].inlineSize - thumbnailWidth) / (2 * thumbnailWidth));
        setThumbnailsNumber(newThumbsNumber);
    });

    return { thumbnailsNumber, getThumbsContainer };
}

function Thumbnail(props: RenderThumbnailProps) {
    const { src, title, thumbnail } = props.slide as Slide;
    return (
        <>
            <ImageSlide key={src} {...props} slide={{ ...props.slide, src: thumbnail || src }} />
            <span className="thumbnailTitle">{title || src}</span>
        </>
    );
}

export { thumbnailsProps, useThumbnailsNumber, Thumbnail }