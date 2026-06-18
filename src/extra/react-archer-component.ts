import { createElement as $, useRef } from "react";
import { ArcherContainer, ArcherElement } from 'react-archer';
import { RelationType } from 'react-archer/lib/types';
import { ArcherContainerHandle } from 'react-archer/lib/ArcherContainer/ArcherContainer.types';
import useResizeObserver from '@react-hook/resize-observer';
import {ArrowContainerProps, ArrowElementProps as ArrowElementServerProps} from "types/c4gen.FrontTags";

export function ArrowContainer({children}: ArrowContainerProps) {
    const boxRef = useRef(null);
    const archerContainerHandle = useRef<ArcherContainerHandle>(null);

    useResizeObserver(boxRef, () => archerContainerHandle.current?.refreshScreen());

    return $(ArcherContainer, {
            ref: archerContainerHandle,
            className: 'archerContainer'
        },
        $("div", {ref: boxRef}, children)
    );
}


interface ArrowElementProps extends Omit<ArrowElementServerProps, 'relations'> {
    relations: RelationType[]
}

export function ArrowElement({id, relations, children}: ArrowElementProps) {
    const rels = relations.map(rel => ({ ...rel, label: createBullet(rel) }));
    return $(ArcherElement, {id, relations: rels, children: $("div", null, children)})
}

function createBullet(rel: RelationType) {
    const arrowDown = rel.targetAnchor === 'top';
    const arrowUp = rel.targetAnchor === 'bottom';
    return arrowDown || arrowUp ? $('div', {
        className: 'arrowBullet',
        style: {
            ...arrowDown && {top: 0, transform: 'translateX(calc(-50% - 0.5px)) translateY(-50%)'},
            ...arrowUp && {bottom: 0, transform: 'translateX(calc(-50% - 0.5px)) translateY(50%)'}
        }
    }) : undefined;
}