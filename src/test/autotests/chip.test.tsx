import React from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import userEvent from "@testing-library/user-event";
import { act, render } from "@testing-library/react";
import type { SendPatch } from "../../extra/exchange/patch-sync";
import { ChipElement, type ChipElementClientProps } from "../../extra/chip/chip";

const enqueue: (identity: object, patch: SendPatch) => void = jest.fn();
const sender = {enqueue, ctxToPath: () => '/test'};

jest.mock('../../main/image', () => ({
    SVGElement: ({
        className,
        onClick,
    }: {className: string, onClick: () => void}) => (
        <svg className={className} onClick={onClick} />
    ),
}));

const SyncProviders = createSyncProviders;

function setup(props?: Partial<ChipElementClientProps>) {
    const user = userEvent.setup();
    render(
        <SyncProviders sender={sender} ack={null} isRoot={true} branchKey=''>
            <ChipElement
                identity={{ key: 'checkbox' }}
                text=''
                color={{tp: "p", cssClass: "greenColor greenColor-text"}}
                receiver={true}
                {...props}
            />
        </SyncProviders>
    );
    const chip = document.querySelector('.chipItem');
    if (!chip) throw Error("Checkbox not found");
    return { user, chip };
}

it('click sends correct patch', async () => {
    const { user, chip } = setup();
    await user.click(chip);
    expect(enqueue).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
            value: '',
            headers: expect.objectContaining({"x-r-action": "click"})
        })
    );
});

it('Ctrl + click copies the text', async () => {
    const TEXT = 'Hello';
    const { user, chip } = setup({ text: TEXT });
    const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText');
    
    await user.keyboard('{Control>}');
    await act(() => user.click(chip));
    await user.keyboard('{/Control}');

    expect(writeTextSpy).toHaveBeenCalledWith(TEXT);
});

it('delAction sends correct patch', async () => {
    const { user, chip } = setup({ delAction: true });
    const closeIcon = chip.querySelector('.closeIcon');
    if (!closeIcon) throw Error("Element not found");

    await user.click(closeIcon);
    expect(enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'delAction' }),
        expect.objectContaining({
            value: '',
            headers: expect.objectContaining({"x-r-action": "click"})
        })
    );
});