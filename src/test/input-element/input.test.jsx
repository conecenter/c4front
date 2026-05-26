import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { createSyncProviders } from "../../main/vdom-hooks";
import { useSyncInput } from '../helpers/sync-input';
import { InputElement } from '../../extra/input-element';
import { KeyboardController } from '../../extra/keyboard-controller';
import { LabeledElement } from '../../extra/labeled-element';

const IDENTITY = { key: "input-element" };

function InputWithSync({ value = "" }) {
    const patch = useSyncInput(IDENTITY, value, () => false);
    return <InputElement path="/input-element" {...patch} />
}

function App({ enqueue, children }) {
    const sender = {enqueue: enqueue || jest.fn(), ctxToPath: () => '/test'}
    return createSyncProviders({sender, ack: null, isRoot: true, branchKey: 'abc', children});
}

const renderMinimal = ({ value, enqueue } = {}) => render(
    <App enqueue={enqueue}>
        <InputWithSync value={value} />
    </App>
);

const renderWithProps = ({ value, enqueue, ...props }) => {
    render(
      <App enqueue={enqueue}>
            <KeyboardController>
                <LabeledElement path="/input-element" label="Input label">
                    <InputWithSync value={value} {...props} />
                </LabeledElement>
            </KeyboardController>
      </App>
    );
}

describe('basic functionality', () => {
    it("input renders and text can be typed", async () => {
        const user = userEvent.setup();
        renderMinimal({});
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        await user.type(input, 'hello');
        expect(input).toHaveValue("hello");
    });

    it("sends x-r-changing header while typing, drops it on blur", async () => {
        const user = userEvent.setup();
        const enqueue = jest.fn();
        renderMinimal({ enqueue });
        const input = screen.getByRole('textbox');
        await user.type(input, 'a');
        const changingHeader = { "x-r-changing": "1" };
        expect(enqueue).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.objectContaining({ headers: expect.objectContaining(changingHeader) })
        );
        await user.tab();
        expect(enqueue).toHaveBeenLastCalledWith(
            expect.anything(),
            expect.not.objectContaining({ headers: expect.objectContaining(changingHeader) })
        );
        expect(enqueue).toHaveBeenCalledTimes(2);
    });

    it("input is readOnly when no onChange and no onBlur provided", () => {
        render(
            <App>
                <InputElement path="/input-element" value="test" />
            </App>
        );
        expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });
});

describe('keyboard input from outside', () => {
    it("typing printable character replaces previous value", async () => {
        const user = userEvent.setup();
        renderWithProps({ value: "abc" });
        await act(() => user.type(screen.getByText("Input label"), "d"));
        expect(screen.getByRole('textbox')).toHaveValue("d");
    });

    it("Enter focuses input at end of value", async () => {
        const user = userEvent.setup();
        renderWithProps({ value: "abc" });
        await user.click(screen.getByText("Input label"));
        await user.keyboard("{Enter}{d}");
        expect(screen.getByRole('textbox')).toHaveValue("abcd");
    });

    it("Clear removes input without focusing input", async () => {
        const user = userEvent.setup();
        renderWithProps({ value: "abc" });
        await user.click(screen.getByText("Input label"));
        await act(() => user.keyboard("{Clear}"));
        const input = screen.getByRole('textbox');
        expect(input).toHaveValue("");
        expect(input).not.toHaveFocus();
    });

    // backspace, delete, cPaste rely on browser continuing native events on the newly focused element, which JSDOM/userEvent doesn't support
    // this functionality will be partly checked in VK section

    it("cCopy focuses input and copies value", async () => {
        document.execCommand = jest.fn();
        const user = userEvent.setup();
        renderWithProps({ value: "abc" });
        await user.click(screen.getByText("Input label"));
        // user.copy() doesn't reliably trigger the window 'copy' listener in jsdom;
        // fireEvent on the active element bubbles correctly to KeyboardController
        act(() => { fireEvent.copy(document.activeElement); });
        expect(screen.getByRole('textbox')).toHaveFocus();
        expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    it("cCut copies value and removes focus from input", async () => {
        document.execCommand = jest.fn();
        const user = userEvent.setup();
        renderWithProps({ value: "abc" });
        await user.click(screen.getByText("Input label"));
        act(() => { fireEvent.cut(document.activeElement); });
        expect(screen.getByRole('textbox')).not.toHaveFocus();
        expect(document.execCommand).toHaveBeenCalledWith('cut');
    });
});
