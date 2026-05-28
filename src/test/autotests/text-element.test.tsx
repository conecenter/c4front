import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextElement } from "../../extra/text-element";

jest.mock('../../main/image', () => ({ SVGElement: () => null }));

it('copies element content', async () => {
    const user = userEvent.setup();
    let selectionAtCopy: Selection | null = null;
    jest.mocked(document.execCommand).mockImplementation((cmd) => {
        if (cmd === 'copy') selectionAtCopy = window.getSelection();
        return false;
    });
    render(<TextElement path="p" content="hello world" onClickCopy={true} />);
    await user.click(screen.getByTitle('Copy'));

    expect(selectionAtCopy).not.toBeNull();
    expect((selectionAtCopy as unknown as Selection).toString()).toBe('hello world');
});

it('clears selection 200ms after copy', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<TextElement path="p" content="hello world" onClickCopy={true} />);
    await user.click(screen.getByTitle('Copy'));

    jest.advanceTimersByTime(200);
    expect(window.getSelection()!.rangeCount).toBe(0);

    jest.useRealTimers();
});
