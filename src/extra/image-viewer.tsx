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
import { Patch, usePatchSync } from "./exchange/patch-sync";
import { useSync } from "../main/vdom-hooks";
import { identityAt } from "../main/vdom-util";

const TRASH_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15120 17000" width="24" height="24" fill="currentColor">
        <path d="M14648 2447l-3537 0 0 -577c0,-1031 -839,-1870 -1870,-1870l-3362 0c-1031,0 -1870,839 -1870,1870l0 577 -3537 0c-262,0 -472,209 -472,471 0,263 210,472 472,472l853 0 0 11087c0,1391 1132,2523 2523,2523l7424 0c1391,0 2523,-1132 2523,-2523l0 -11087 853 0c262,0 472,-209 472,-472 0,-262 -210,-471 -472,-471zm-9695 -577c0,-510 415,-926 926,-926l3362 0c510,0 926,416 926,926l0 577 -5214 0 0 -577zm7898 12607c0,870 -709,1579 -1579,1579l-7424 0c-870,0 -1580,-709 -1580,-1579l0 -11087 10587 0 0 11087 -4 0zm-5291 -112c262,0 472,-210 472,-472l0 -8339c0,-262 -210,-472 -472,-472 -262,0 -472,210 -472,472l0 8335c0,263 210,476 472,476zm-3079 -521c262,0 472,-210 472,-472l0 -7301c0,-262 -210,-472 -472,-472 -262,0 -472,210 -472,472l0 7301c0,262 213,472 472,472zm6158 0c262,0 472,-210 472,-472l0 -7301c0,-262 -210,-472 -472,-472 -262,0 -472,210 -472,472l0 7301c0,262 210,472 472,472z"/>
    </svg>
);

interface Slide {
    src: string,
    title?: string,
    id?: string,
}

interface ImageViewer {
    identity: Object,
    index?: number,
    slides?: Slide[],
    position?: 'fullscreen' | 'inline',
    removable?: boolean
}

// Server exchange
const changeToPatch = (ch: string) => ({ value: ch });
const patchToChange = (p: Patch) => p.value;
const applyChange = (prev: number, ch: string) => ch ? +ch : prev;

const deleteActionIdOf = identityAt('receiver');


function ImageViewer({identity, index: state = 0, slides = [], position, removable }: ImageViewer) {
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
    const closeButton = <IconButton key='ACTION_CLOSE' label='Close' icon={CloseIcon} onClick={handleClose} />;

    const [_, enqueueDeleteActionPatch] = useSync(deleteActionIdOf(identity));
    const onDelete = () => enqueueDeleteActionPatch({ value: slidesMemo[index].id });
    const deleteButton = removable && (
        <button key="deleteButton" type="button" className="yarl__button" onClick={onDelete}>{TRASH_ICON}</button>
    );

    return (
        <div ref={elem => setBodyRef(elem?.ownerDocument.body)} className={clsx(inlinePos && 'inlineImageViewer')} >
            <Lightbox
                open={true}
                slides={slidesMemo}
                index={startingIndexRef.current}
                controller={{ ref: controller }}
                portal={{ root: bodyRef }}
                plugins={[Captions, Counter, Zoom, Thumbnails, ...inlinePos ? [Inline] : []]}
                thumbnails={{ vignette: false }}
                zoom={{
                    wheelZoomDistanceFactor: 500,
                    pinchZoomDistanceFactor: 200,
                    maxZoomPixelRatio: 3
                }}
                on={{
                    view: ({index: next}) => next !== index && sendTempChange(next.toString())
                }}
                render={{
                    ...slides.length <= 1 && {
                        buttonPrev: () => null,
                        buttonNext: () => null
                    }
                }}
                toolbar={{ buttons: [deleteButton, closeButton] }}
            />
        </div>
    );
}

export {ImageViewer}