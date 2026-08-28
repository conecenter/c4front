import React, { ReactElement } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSyncProviders as SyncProviders } from "../../main/vdom-hooks";
import { UserLocaleProvider } from "../../extra/locale";
import { TEST_LOCALE } from "../datepicker/test-locale";
import { PopupManager } from "../../extra/popup-elements/popup-manager";
import { TimePicker } from "../../extra/timepicker/timepicker";
import type { SendPatch } from "../../extra/exchange/patch-sync";
import { KeyboardController } from "../../extra/keyboard-controller";

const TP_IDENTITY = { key: 'timepicker' };

const enqueue: (identity: object, patch: SendPatch) => void = jest.fn();
const sender = { enqueue, ctxToPath: () => '/test' };

function TestApp({ children }: { children: ReactElement }) {
    return (
        <SyncProviders sender={sender} ack={null} isRoot={true} branchKey=''>
            <UserLocaleProvider identity={{key: 'locale'}} locale={TEST_LOCALE}>
                {[<PopupManager key='pm' identity={{ key: 'popup-manager' }} openedPopups={[]}>
                    {[children]}
                </PopupManager>]}
            </UserLocaleProvider>
        </SyncProviders>
    );
}

test('happy path: input 22-05 -> 22:05 + correct patches', async () => {
    const user = userEvent.setup();
    render(
        <TestApp>
            <TimePicker
                identity={TP_IDENTITY} receiver={true}
                state={{inputValue: "", tp: "input-state"}}
                timestampFormatId={11964}
            />
        </TestApp>
    );
    const input = screen.getByRole('textbox');
    await user.type(input, '22-05');
    expect(enqueue).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ headers: expect.objectContaining({"x-r-changing": "1"}) })
    );
    await user.click(document.body);
    expect(enqueue).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.not.objectContaining({ headers: expect.objectContaining({"x-r-changing": "1"}) })
    );
    expect(input).toHaveValue('22:05');
});

test('happy path: pick time via popup', async () => {
    const user = userEvent.setup();
    render(
        <TestApp>
            <>
                <div data-testid='focusHelper' tabIndex={0} />
                <TimePicker
                    identity={TP_IDENTITY} receiver={true}
                    state={{inputValue: "", tp: "input-state"}}
                    timestampFormatId={11964}
                />
            </>
        </TestApp>
    );
    await user.click(screen.getByRole('button'));
    await act(() => user.click(screen.getAllByText('09')[0]));
    const popupMins = screen.getByText('30');
    await act(() => user.click(popupMins));
    await act(() => user.click(screen.getByTestId('focusHelper')));

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('09:30');
    expect(popupMins).not.toBeInTheDocument();
});

test('keyboard happy path: input from outside clears prev val, Enter moves focus', async () => {
    const user = userEvent.setup();
    render(
        <TestApp>
            <KeyboardController>
                <div className='focusWrapper' data-testid='focusHelper' tabIndex={0}>
                    <TimePicker
                        identity={TP_IDENTITY} receiver={true}
                        state={{timestamp: 60000, tp: "timestamp-state"}}
                        timestampFormatId={11964}
                    />
                </div>
            </KeyboardController>
        </TestApp>
    );
    const focusWrapper = screen.getByTestId('focusHelper');
    const input = screen.getByRole('textbox');
    
    await user.type(focusWrapper, '10-20');
    await user.keyboard('{Enter}');
    
    expect(input).toHaveValue('10:20');
    expect(input).not.toHaveFocus();
});

test('arrow buttons controls time', async () => {
    const user = userEvent.setup();
    render(
        <TestApp>
            <TimePicker
                identity={TP_IDENTITY} receiver={true}
                state={{timestamp: 60000, tp: "timestamp-state"}}
                timestampFormatId={11964}
            />
        </TestApp>
    );
    const input = screen.getByRole('textbox');

    await user.pointer({target: input, offset: 0, keys: '[MouseLeft]'});
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowRight}{ArrowRight}{ArrowDown}{ArrowDown}');

    expect(input).toHaveValue('01:59');
});

test('Esc returns prev val + removes focus', async () => {
    render(
        <TestApp>
            <TimePicker
                identity={TP_IDENTITY} receiver={true}
                state={{timestamp: 60000, tp: "timestamp-state"}}
                timestampFormatId={11964}
            />
        </TestApp>
    );
    const user = userEvent.setup();
    const input = screen.getByRole('textbox');

    await user.type(input, '111');
    await user.keyboard('{Escape}');

    expect(input).toHaveValue('00:01');
    expect(input).not.toHaveFocus();
});