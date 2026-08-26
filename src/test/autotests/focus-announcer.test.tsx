import React from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import userEvent from "@testing-library/user-event";
import { act, render } from "@testing-library/react";
import { FocusAnnouncerElement } from "../../extra/focus-announcer";
import type { SendPatch } from "../../extra/exchange/patch-sync";

const FOCUS_ANNOUNCER_PATH = '/focus-ann';
const FOCUS_WRAPPER_CLASS = 'focusWrapper';
const TARGET_ELEM_CLASS = 'target';
const IDENTITY = { key: 'focus-announcer' };
const TEST_PATH = '/test-path';
const WRAPPER_PATH = '/wrapper-path';

const enqueue: (identity: object, patch: SendPatch) => void = jest.fn();
const sender = {enqueue, ctxToPath: () => FOCUS_ANNOUNCER_PATH};

const SyncProviders = createSyncProviders;

function TestApp({ value, renderTarget = true }: { value: string, renderTarget?: boolean }) {
    return (
        <SyncProviders sender={sender} ack={null} isRoot={true} branchKey=''>
            <FocusAnnouncerElement identity={IDENTITY} value={value} receiver={true} >
                {[
                    <div key='wrapper' tabIndex={1} className={FOCUS_WRAPPER_CLASS} data-path={WRAPPER_PATH}>
                        {renderTarget &&
                            <div key='test' tabIndex={1} className={`${FOCUS_WRAPPER_CLASS} ${TARGET_ELEM_CLASS}`} data-path={TEST_PATH}/>}
                    </div>
                ]}
            </FocusAnnouncerElement>
        </SyncProviders>
    );
}

it('user focus reports the correct path', async () => {
    const user = userEvent.setup();
    render(<TestApp value={FOCUS_ANNOUNCER_PATH} />);
    const elem = document.querySelector<HTMLDivElement>(`.${TARGET_ELEM_CLASS}`);
    if (!elem) throw Error('Elem not found');

    await act(() => user.click(elem));
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ headers: {"x-r-action": "change"}, value: TEST_PATH })
    );
});

it('server focus state change moves focus', () => {
    const {rerender} = render(
        <TestApp value={FOCUS_ANNOUNCER_PATH} />
    );
    rerender(
        <TestApp value={TEST_PATH} />
    );
    const elem = document.querySelector<HTMLDivElement>(`.${TARGET_ELEM_CLASS}`);
    if (!elem) throw Error('Elem not found');

    expect(elem).toHaveFocus();
    expect(enqueue).not.toHaveBeenCalled();
});

it('focus is restored after the focused element is removed', () => {
    const {rerender} = render(
        <TestApp value={TEST_PATH} />
    );
    const elem = document.querySelector<HTMLDivElement>(`.${TARGET_ELEM_CLASS}`);
    if (!elem) throw Error('Elem not found');

    expect(elem).toHaveFocus();

    rerender(
        <TestApp value={TEST_PATH} renderTarget={false} />
    );
    const wrapper = document.querySelector<HTMLDivElement>(`.${FOCUS_WRAPPER_CLASS}`);
    if (!wrapper) throw Error('Elem not found');

    expect(wrapper).toHaveFocus();
    expect(enqueue).not.toHaveBeenCalled();
});