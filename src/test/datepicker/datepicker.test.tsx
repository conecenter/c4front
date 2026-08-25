import React, { ReactElement } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { DatePickerInputElement } from "../../extra/datepicker/datepicker";
import { createSyncProviders } from "../../main/vdom-hooks";
import { TEST_LOCALE } from "./test-locale";
import { UserLocaleProvider } from "../../extra/locale";
import { PopupManager } from "../../extra/popup-elements/popup-manager";
import { KeyboardController } from "../../extra/keyboard-controller";
import type { SendPatch } from "../../extra/exchange/patch-sync";
import type { DatePickerInputElementProps, DatePickerServerState } from "types/c4gen.LocaleTagsApi";

type EnqueueFn = (identity: object, patch: SendPatch) => void;

const DEFAULT_PROPS: DatePickerInputElementProps = {
    identity: { key: 'test' },
    state: {inputValue: "", tp: "input-state"},
    timestampFormatId: 11967,
    deferredSend: false,
    receiver: true
}

const renderWithProps = (props: DatePickerInputElementProps, enqueue?: EnqueueFn) => {
  render(
    <App enqueue={enqueue}>
      <DatePickerInputElement {...props} />
    </App>
  );
}

function App(props: {children: ReactElement, enqueue?: EnqueueFn}) {
  const sender = {enqueue: props.enqueue || jest.fn(), ctxToPath: () => '/test'};
  return createSyncProviders({sender, ack: null, isRoot: true, branchKey: '', children:
    <UserLocaleProvider identity={{key: 'locale'}} locale={TEST_LOCALE}>
        {[<PopupManager key='pm' identity={{ key: 'popup-manager' }} openedPopups={[]}>
            {[props.children]}
        </PopupManager>]}
    </UserLocaleProvider>
  });
}

describe('basic functionality', () => {
    it('happy path: type 1/1/2026 -> 01/01/2026', async () => {
        const user = userEvent.setup();
        renderWithProps(DEFAULT_PROPS);
        const input = screen.getByRole('textbox');
        await user.type(input, '1/1/2026');
        await user.click(document.body);
        expect(input).toHaveValue('01/01/2026');
    });

    it('send temp/final patches correctly', async () => {
        const user = userEvent.setup();
        const enqueue = jest.fn();
        renderWithProps(DEFAULT_PROPS, enqueue);
        const input = screen.getByRole('textbox');
        await user.type(input, '1/1/2026');
        const changingHeader = { "x-r-changing": "1" };
        expect(enqueue).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.objectContaining({ headers: expect.objectContaining(changingHeader) })
        );
        await user.click(document.body);
        expect(enqueue).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.not.objectContaining({ headers: expect.objectContaining(changingHeader) })
        );
    })
});

describe('calendar popup functionality', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('happy path: pick a date via calendar popup', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2026, 0, 15));
        const user = userEvent.setup({
            advanceTimers: jest.advanceTimersByTime
        });
        renderWithProps(DEFAULT_PROPS);
        await user.click(screen.getByRole('button'));
        const calendarPopupMonthBtn = screen.getByText(TEST_LOCALE.months[0].fullName);
        expect(calendarPopupMonthBtn).toBeVisible();

        await user.click(calendarPopupMonthBtn);
        await user.click(screen.getByText(TEST_LOCALE.months[1].fullName));

        const yearUpBtn = document.querySelector('.dpArrowBtnUp');
        if (!yearUpBtn) throw Error('No year up btn found');
        await user.click(yearUpBtn);

        await user.click(screen.getByText('20'));
        expect(screen.getByRole('textbox')).toHaveValue('20/02/2027');
        expect(calendarPopupMonthBtn).not.toBeInTheDocument();
    });
})

function setupWithKeyboard(
    initState: DatePickerServerState = {tp: "timestamp-state", timestamp: '1767222000000'}  // 01/01/2026
) {
    const user = userEvent.setup();
    render(
        <App>
            <KeyboardController>
                <div className='focusWrapper' tabIndex={1}>
                    <DatePickerInputElement {...DEFAULT_PROPS} state={initState} />
                </div>
            </KeyboardController>
        </App>
    );
    const inputBox = document.querySelector('.inputBox');
    if (!inputBox) throw Error("No input box found");
    const input = screen.getByRole<HTMLInputElement>('textbox');
    return { user, inputBox, input };
}

describe('keyboard controls', () => {
    it('date changes with arrow keys', async () => {
        const { user, input } = setupWithKeyboard();
        await user.pointer({target: input, offset: 0, keys: '[MouseLeft]'});
        await user.keyboard('{ArrowUp}{ArrowRight}{ArrowRight}{ArrowDown}');
        await user.click(document.body);
        expect(input).toHaveValue('02/12/2026');
    });

    it('input from outside with keyboard flow', async () => {
        const { user, input, inputBox } = setupWithKeyboard();
        await act(() => user.type(inputBox, '2 2 26'));
        await user.keyboard('{Enter}');
        expect(input).toHaveValue('02/02/2026');
    });

    it.each(['{Delete}', '{Backspace}'])(
        '%s from outside clears the input', async (key) => {
            const { user, input, inputBox } = setupWithKeyboard();
            await user.click(inputBox);
            await act(() => user.keyboard(key));
            expect(input).toHaveValue('');
        }
    );

    it('Esc restores prev value & removes focus', async () => {
        const JAN_1_2026_TIMESTAMP = '1767222000000';
        const { user, input, inputBox } = setupWithKeyboard(
            {tp: "timestamp-state", timestamp: JAN_1_2026_TIMESTAMP}
        );
        await act(() => user.type(inputBox, '2 2 26'));
        await user.keyboard('{Escape}');
        expect(input).toHaveValue('01/01/2026');
        expect(input).not.toHaveFocus();
    });

    it('Enter from outside puts focus at the end of input', async () => {
        const { user, input, inputBox } = setupWithKeyboard();
        await user.click(inputBox);
        await act(() => user.keyboard('{Enter}'));
        expect(input).toHaveFocus();
        expect(input.selectionStart).toBe(10);
        expect(input.selectionEnd).toBe(10);
    })
});