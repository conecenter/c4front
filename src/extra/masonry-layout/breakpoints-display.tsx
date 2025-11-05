import React from "react";
import { ChipElement } from "../chip/chip";
import { LabeledElement } from "../labeled-element";
import { SegmentedChip } from "../segmented-chip";

interface BreakpointsDisplay {
    breakpoints: { [P: string]: number },
    currentBp: string | null
}

function BreakpointsDisplay({ breakpoints, currentBp }: BreakpointsDisplay) {
    const bpChips = Object.entries(breakpoints)
        .sort((a, b) => a[1] - b[1])
        .map((bp, i) => (
            <ChipElement
                key={`chip-${i}`}
                identity={{}}
                text={`${bp[0]}: ${bp[1]}`}
                color={{
                    tp: 'p',
                    cssClass: bp[0] === currentBp ? 'greenLighterColorCss' : 'grayLighterColorCss'}
                } />));
    return (
        <>
            <LabeledElement label='Breakpoints:' className='masonryBps' sizes={{ min: 3, max: 10 }}>
                <SegmentedChip
                    identity={{ key: "segmented-chip" }}
                    compact={true}
                    routeParts={bpChips} />
            </LabeledElement>
            <hr />
        </>
    )
}

export { BreakpointsDisplay }