import React, { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { DatePickerInputElement } from "../../extra/datepicker/datepicker";
import { createSyncProviders } from "../../main/vdom-hooks";
import { TEST_LOCALE } from "./test-locale";
import { UserLocaleProvider } from "../../extra/locale";
import { PopupManager } from "../../extra/popup-elements/popup-manager";

const DEFAULT_IDENTITY = { key: 'test' };

function App(props: {children: ReactElement}) {
  const sender = {enqueue: jest.fn(), ctxToPath: () => '/test'};
  return createSyncProviders({sender, ack: null, isRoot: true, branchKey: '', children:
    <UserLocaleProvider identity={{key: 'locale'}} locale={TEST_LOCALE}>
        {[<PopupManager key='pm' identity={{ key: 'popup-manager' }} openedPopups={[]}>
            {[props.children]}
        </PopupManager>]}
    </UserLocaleProvider>
  });
}

afterEach(() => {
  jest.useRealTimers();
});

describe('basic functionality', () => {
    it('happy path: type 1/1/2026 -> 01/01/2026', async () => {
        const user = userEvent.setup();
        render(
            <App>
                <DatePickerInputElement
                    identity={DEFAULT_IDENTITY}
                    state={{inputValue: "", tp: "input-state"}}
                    timestampFormatId={11967}
                    deferredSend={false}
                    receiver={true}
                />
            </App>
        );
        const input = screen.getByRole('textbox');
        await user.type(input, '1/1/2026');
        await user.click(document.body);
        expect(input).toHaveValue('01/01/2026');
    });

    it('happy path: pick a date via calendar popup', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2026, 0, 15));
        const user = userEvent.setup({
            advanceTimers: jest.advanceTimersByTime
        });
        render(
            <App>
                <DatePickerInputElement
                    identity={DEFAULT_IDENTITY}
                    state={{inputValue: "", tp: "input-state"}}
                    timestampFormatId={11967}
                    deferredSend={false}
                    receiver={true}
                />
            </App>
        );
        await user.click(screen.getByRole('button'));
        const calendarPopup = screen.getByText(TEST_LOCALE.months[0].fullName);
        expect(calendarPopup).toBeVisible();

        await user.click(screen.getByText('20'));
        expect(screen.getByRole('textbox')).toHaveValue('20/01/2026');
        expect(calendarPopup).not.toBeInTheDocument();
    });
});