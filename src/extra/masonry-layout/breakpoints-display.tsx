import React from "react";
import { ChipElement } from "../chip/chip";
import { LabeledElement } from "../labeled-element";
import { SegmentedChip } from "../segmented-chip";

interface BreakpointsDisplay {
    breakpoints: { [P: string]: number },
    currentBp: string | null,
    scale: number,
    onBreakpointChange: (bp: string) => void
}

function BreakpointsDisplay({ breakpoints, currentBp, scale, onBreakpointChange }: BreakpointsDisplay) {
    const bpChips = Object.entries(breakpoints)
        .sort((a, b) => a[1] - b[1])
        .map((bp, i) => (
            <ChipElement
                key={`chip-${i}`}
                identity={{}}
                text={`${bp[0]}: >${bp[1]}px`}
                onClick={() => bp[0] && onBreakpointChange(bp[0])}
                color={{
                    tp: 'p',
                    cssClass: bp[0] === currentBp ? 'greenLighterColorCss' : 'grayLighterColorCss'}
                } />));
    return (
        <div className='masonryBps' >
            <LabeledElement label='Breakpoints:' sizes={{ min: 3, max: 10 }}>
                <SegmentedChip
                    identity={{ key: "segmented-chip" }}
                    compact={true}
                    routeParts={bpChips} />
            </LabeledElement>
            <LabeledElement>
                <ChipElement
                    identity={{}}
                    text={`Scale: ${scale * 100}%`}
                    color={{ tp: 'p', cssClass: 'bodyColorCss' }}
                />
            </LabeledElement>
        </div>
    )
}

export { BreakpointsDisplay }