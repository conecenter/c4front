import React from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import { CheckboxElement } from "../../extra/checkbox";
import userEvent from "@testing-library/user-event";
import { act, render } from "@testing-library/react";
import { KeyboardController } from "../../extra/keyboard-controller";
import type { SendPatch } from "../../extra/exchange/patch-sync";
import type { CheckboxElementProps } from "types/c4gen.FrontContextTagsApi";

const enqueue: (identity: object, patch: SendPatch) => void = jest.fn();
const sender = {enqueue, ctxToPath: () => '/test'};

const SyncProviders = createSyncProviders;

function setup(props?: Partial<CheckboxElementProps>) {
    const user = userEvent.setup();
    render(
        <SyncProviders sender={sender} ack={null} isRoot={true} branchKey=''>
            <KeyboardController>
                <CheckboxElement identity={{ key: 'checkbox' }} value='' receiver={true} {...props} />
            </KeyboardController>
        </SyncProviders>
    );
    const checkbox = document.querySelector('.imageBox');
    if (!checkbox) throw Error("Checkbox not found");
    return { user, checkbox };
}

it('click toggles checkbox & sends correct patch', async () => {
    const { user, checkbox } = setup();
    await user.click(checkbox);
    expect(checkbox).toHaveClass('isChecked');
    expect(enqueue).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.objectContaining({
            value: 'checked',
            headers: expect.objectContaining({ 'x-r-action': 'change' })
        })
    );

    await user.click(checkbox);
    expect(checkbox).not.toHaveClass('isChecked');
    expect(enqueue).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.objectContaining({ value: '' })
    );
});

it("readonly checkbox don't change state", async () => {
    const { user, checkbox } = setup({ receiver: false });
    await user.click(checkbox);
    expect(checkbox).not.toHaveClass('isChecked');
    expect(enqueue).not.toHaveBeenCalled();
});

it("checkbox activates from outside by Enter", async () => {
    const { user, checkbox } = setup();
    const wrapper = document.querySelector('.focusWrapper');
    if (!wrapper) throw Error("Element not found");

    await user.click(wrapper);
    await act(() => user.keyboard('{Enter}'));
    expect(checkbox).toHaveClass('isChecked');
});