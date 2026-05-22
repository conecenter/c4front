import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { createSyncProviders } from "../../main/vdom-hooks";
import { useSyncInput } from '../helpers/sync-input';
import { InputElement } from '../../extra/input-element';

const IDENTITY = { key: "input-element" };

function InputWithSync({ value = "" }) {
    const patch = useSyncInput(IDENTITY, value, () => false);
    return <InputElement path="/input-element" {...patch} />
}

function App({ children }) {
    const sender = {enqueue: jest.fn(), ctxToPath: () => '/test'}
    return createSyncProviders({sender, ack: null, isRoot: true, branchKey: 'abc', children});
}

const renderWithValue = (value) => {
    render(
      <App>
        <InputWithSync value={value} />
      </App>
    );
}

// 1) focus inside input, type 'abc', focus out -> should be 'abc' final value
// 2) sends x-r-changing header while typing, drops it on blur
describe('basic functionality', () => {
    it("input renders and text can be typed", async () => {
        const user = userEvent.setup();
        renderWithValue();
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        await user.type(input, 'hello');
        expect(input).toHaveValue("hello");
    });
});
