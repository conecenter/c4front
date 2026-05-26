import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { createSyncProviders } from "../../main/vdom-hooks";
import { useSyncInput } from '../helpers/sync-input';
import { InputElement } from '../../extra/input-element';
import { KeyboardController } from '../../extra/keyboard-controller';
import { LabeledElement } from '../../extra/labeled-element';

const IDENTITY = { key: "input-element" };

function InputWithSync({ value = "", ...props }) {
    const patch = useSyncInput(IDENTITY, value, () => false);
    return <InputElement path="/input-element" {...props} {...patch} />
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

describe('VK input', () => {
    it("printable character replaces previous value and focuses input", async () => {
        const user = userEvent.setup();
        renderWithProps({ value: "abc" });
        await user.click(screen.getByText("Input label"));
        await act(async () => {
            fireEvent.keyDown(window, { key: 'a', code: 'vk' });
        });
        expect(screen.getByRole('textbox')).toHaveValue("a");
        expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it("printable character inserts at cursor when input is already focused", async () => {
        const user = userEvent.setup();
        renderWithProps({ value: "abc" });
        const input = screen.getByRole('textbox');
        await user.click(input);
        input.setSelectionRange(2, 2);
        await act(async () => {
            fireEvent.keyDown(window, { key: 'd', code: 'vk' });
        });
        expect(input).toHaveValue("abdc");
        expect(input).toHaveFocus();
    });

    it("cursor lands after inserted character, not at end of input", async () => {
        const user = userEvent.setup();
        renderWithProps({ value: "abc" });
        const input = screen.getByRole('textbox');
        await user.click(input);
        input.setSelectionRange(1, 1); // cursor after 'a'
        await act(async () => {
            fireEvent.keyDown(window, { key: 'x', code: 'vk' });
        });
        expect(input).toHaveValue("axbc");
        expect(input.selectionStart).toBe(2); // after 'x', not at end (4)
    });

    it("Delete from outside clears value and focuses input", async () => {
        const user = userEvent.setup();
        renderWithProps({ value: "abc" });
        await user.click(screen.getByText("Input label"));
        await act(async () => {
            fireEvent.keyDown(window, { key: 'Delete', code: 'vk' });
        });
        expect(screen.getByRole('textbox')).toHaveValue("");
        expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it("Delete in focused input removes character before cursor", async () => {
        const user = userEvent.setup();
        renderWithProps({ value: "abc" });
        const input = screen.getByRole('textbox');
        await user.click(input);
        input.setSelectionRange(2, 2);
        await act(async () => {
            fireEvent.keyDown(window, { key: 'Delete', code: 'vk' });
        });
        expect(input).toHaveValue("ac");
        expect(input.selectionStart).toBe(1); // cursor at deletion point, not at end (2)
    });

    it("Backspace from outside removes last character and focuses input", async () => {
        const user = userEvent.setup();
        renderWithProps({ value: "abc" });
        await user.click(screen.getByText("Input label"));
        await act(async () => {
            fireEvent.keyDown(window, { key: 'Backspace', code: 'vk' });
        });
        expect(screen.getByRole('textbox')).toHaveValue("ab");
        expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it("Backspace in focused input removes character before cursor", async () => {
        const user = userEvent.setup();
        renderWithProps({ value: "abc" });
        const input = screen.getByRole('textbox');
        await user.click(input);
        input.setSelectionRange(2, 2);
        await act(async () => {
            fireEvent.keyDown(window, { key: 'Backspace', code: 'vk' });
        });
        expect(input).toHaveValue("ac");
        expect(input.selectionStart).toBe(1); // cursor at deletion point, not at end (2)
    });

    it("cursor lands after inserted character when replacing a selection", async () => {
        const user = userEvent.setup();
        renderWithProps({ value: "abc" });
        const input = screen.getByRole('textbox');
        await user.click(input);
        input.setSelectionRange(1, 3); // select "bc"
        await act(async () => {
            fireEvent.keyDown(window, { key: 'x', code: 'vk' });
        });
        expect(input).toHaveValue("ax");
        expect(input.selectionStart).toBe(2); // after 'x', not at end (still 2 here but explicit)
    });

    it("VK ignores character not matching inputRegex", async () => {
        const user = userEvent.setup();
        renderWithProps({ value: "12", inputRegex: "[0-9]" });
        await user.click(screen.getByText("Input label"));
        await act(async () => {
            fireEvent.keyDown(window, { key: 'a', code: 'vk' });
        });
        // 'a' fails regex → validateInput returns '' → focused but value unchanged
        expect(screen.getByRole('textbox')).toHaveValue("");
        expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it("VK printable character replaces selected text", async () => {
        const user = userEvent.setup();
        renderWithProps({ value: "abc" });
        const input = screen.getByRole('textbox');
        await user.click(input);
        input.setSelectionRange(1, 3); // select "bc"
        await act(async () => {
            fireEvent.keyDown(window, { key: 'd', code: 'vk' });
        });
        expect(input).toHaveValue("ad");
    });
});
