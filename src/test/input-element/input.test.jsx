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

function App({ enqueue, children }) {
    const sender = {enqueue: enqueue || jest.fn(), ctxToPath: () => '/test'}
    return createSyncProviders({sender, ack: null, isRoot: true, branchKey: 'abc', children});
}

const renderWithProps = ({ value, enqueue }) => {
    render(
      <App enqueue={enqueue}>
        <InputWithSync value={value} />
      </App>
    );
}

describe('basic functionality', () => {
    it("input renders and text can be typed", async () => {
        const user = userEvent.setup();
        renderWithProps({});
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        await user.type(input, 'hello');
        expect(input).toHaveValue("hello");
    });

    it("sends x-r-changing header while typing, drops it on blur", async () => {
        const user = userEvent.setup();
        const enqueue = jest.fn();
        renderWithProps({ enqueue });
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
});
