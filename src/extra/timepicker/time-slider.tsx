import React, { useEffect, useRef } from "react";
import { createArray } from "../utils";
import { TOKEN_DATA } from "./time-utils";

const TIME_ITEM_HEIGHT = 2;

interface TimeSliderBlock {
    token: string,
    current: number,
    onClick: (i: number, token: string) => void
}

function TimeSliderBlock({token, current, onClick}: TimeSliderBlock) {
    const ref = useRef<HTMLDivElement | null>(null);
    const max = TOKEN_DATA[token].max - 1;
    const { formatTo } = TOKEN_DATA[token];

    // Ref for smooth scroll after click
    const isClicked = useRef(false);

    // Create time items blocks
    const handleClick = (i: number, token: string) => {
        isClicked.current = true;
        onClick(i, token);
    }

    const getTimeItem = (i: number) => (
        <span key={i}
              onClick={() => handleClick(i, token)}
              className={i === current ? 'current' : undefined} 
              style={{height: `${TIME_ITEM_HEIGHT}em`}}>
            {(formatTo(i))}
        </span>
    );

    const mainBlock = createArray(0, max).map(getTimeItem);
    const auxBlock = createArray(Math.max(max - 19, 0), max).map(getTimeItem);

    // Scroll functionality
    useEffect(() => {
        const scrollOffset = current < max - 3 ? 0 : -mainBlock.length;
        ref.current?.scrollTo({
            top: (17 + current + scrollOffset)*2*16,
            ...isClicked.current && {behavior: 'smooth'}
        });
        isClicked.current = false;
    }, [current]);

    const handleScroll = () => {
        const elem = ref.current;
        if (!elem) return;
        const scrollCoeff = elem.scrollTop > (elem.scrollHeight - elem.clientHeight - 50) 
            ? -1 : elem.scrollTop < 50 ? 1 : 0;
        scrollCoeff && elem.scrollBy(0, scrollCoeff * mainBlock.length*2*16);
    }

    return (
        <div ref={ref} className='timeSlider' onScroll={handleScroll}>
            {auxBlock}
            {mainBlock}
        </div>
    );
}

export { TimeSliderBlock, TIME_ITEM_HEIGHT }