import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { PopupDrawerContext } from '../../extra/popup-elements/popup-contexts';
import DropDownElement from '../../extra/dropdown';

// DropDownElement manages no internal server state — it receives open/onClick/onClickValue
// as props and delegates sync to the caller, so no createSyncProviders wrapper is needed.

function renderDropdown({ drawerEl = null, ...props } = {}) {
    const el = <DropDownElement path="/dropdown" open={false} onClick={jest.fn()} {...props} />;
    return render(
        drawerEl
            ? <PopupDrawerContext.Provider value={drawerEl}>{el}</PopupDrawerContext.Provider>
            : el
    );
}

let requestAnimationFrameSpy;

beforeEach(() => {
    // Initial popup positioning runs in useLayoutEffect. These behavior tests do
    // not need the continuous animation-frame polling used to track layout changes.
    requestAnimationFrameSpy = jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation(() => 0);
});

afterEach(() => {
    requestAnimationFrameSpy.mockRestore();
});

describe('basic functions', () => {
    it("renders a text input and toggle button", () => {
        renderDropdown({ onChange: jest.fn(), onBlur: jest.fn() });
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it("calls onClick when the toggle button is clicked", async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        renderDropdown({ onClick, onChange: jest.fn(), onBlur: jest.fn() });
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("wraps typed value with x-r-action: change header", async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        renderDropdown({ onChange, onBlur: jest.fn() });
        await user.type(screen.getByRole('textbox'), 'a');
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                target: expect.objectContaining({
                    headers: expect.objectContaining({ 'x-r-action': 'change' })
                })
            })
        );
    });
});

describe('popup', () => {
    let drawer;
    beforeEach(() => {
        drawer = document.createElement('div');
        document.body.appendChild(drawer);
    });
    afterEach(() => {
        document.body.removeChild(drawer);
    });

    it("renders popup children when open=true", () => {
        renderDropdown({
            open: true,
            onChange: jest.fn(),
            onBlur: jest.fn(),
            drawerEl: drawer,
            children: [
                <div key="opt1" className="popup">Option A</div>,
                <div key="opt2" className="popup">Option B</div>,
            ]
        });
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
    });

    it("does not render popup children when open=false", () => {
        renderDropdown({
            open: false,
            onChange: jest.fn(),
            onBlur: jest.fn(),
            drawerEl: drawer,
            children: [
                <div key="opt1" className="popup">Option A</div>,
                <div key="opt2" className="popup">Option B</div>,
            ]
        });
        expect(screen.queryByText('Option A')).not.toBeInTheDocument();
    });
});

describe('keyboard handling', () => {
    it("ArrowDown when closed calls onClick to open the dropdown", async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        renderDropdown({ open: false, onClick, onChange: jest.fn(), onBlur: jest.fn() });
        await user.click(screen.getByRole('textbox'));
        await user.keyboard('{ArrowDown}');
        expect(onClick).toHaveBeenCalled();
    });

    it("ArrowDown when open sends ArrowDown via onClickValue instead of calling onClick", async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        const onClickValue = jest.fn();
        renderDropdown({ open: true, onClick, onClickValue, onChange: jest.fn(), onBlur: jest.fn() });
        await user.click(screen.getByRole('textbox'));
        await user.keyboard('{ArrowDown}');
        expect(onClickValue).toHaveBeenCalledWith("key", "ArrowDown", null);
        expect(onClick).not.toHaveBeenCalled();
    });

    it("ArrowUp when open sends ArrowUp via onClickValue", async () => {
        const user = userEvent.setup();
        const onClickValue = jest.fn();
        renderDropdown({ open: true, onClickValue, onChange: jest.fn(), onBlur: jest.fn() });
        await user.click(screen.getByRole('textbox'));
        await user.keyboard('{ArrowUp}');
        expect(onClickValue).toHaveBeenCalledWith("key", "ArrowUp", null);
    });

    it("Enter when open confirms selection: calls onClickValue and onBlur", async () => {
        const user = userEvent.setup();
        const onClickValue = jest.fn();
        const onBlur = jest.fn();
        renderDropdown({ open: true, onClickValue, onBlur, onChange: jest.fn() });
        await user.click(screen.getByRole('textbox'));
        await user.keyboard('{Enter}');
        expect(onClickValue).toHaveBeenCalledWith("key", "Enter", null);
        expect(onBlur).toHaveBeenCalled();
    });

    it("Enter when closed does not call onClickValue", async () => {
        const user = userEvent.setup();
        const onClickValue = jest.fn();
        renderDropdown({ open: false, onClickValue, onChange: jest.fn(), onBlur: jest.fn() });
        await user.click(screen.getByRole('textbox'));
        await user.keyboard('{Enter}');
        expect(onClickValue).not.toHaveBeenCalled();
        expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it("Escape calls onClickValue with Escape key", async () => {
        const user = userEvent.setup();
        const onClickValue = jest.fn();
        renderDropdown({ onClickValue, onChange: jest.fn(), onBlur: jest.fn() });
        await user.click(screen.getByRole('textbox'));
        await user.keyboard('{Escape}');
        expect(onClickValue).toHaveBeenCalledWith("key", "Escape", null);
    });

    it("Backspace on empty input calls onClickValue to clear the selection", async () => {
        const user = userEvent.setup();
        const onClickValue = jest.fn();
        renderDropdown({ value: "", onClickValue, onChange: jest.fn(), onBlur: jest.fn() });
        await user.click(screen.getByRole('textbox'));
        await user.keyboard('{Backspace}');
        expect(onClickValue).toHaveBeenCalledWith("key", "Backspace", null);
    });

    it("Backspace is suppressed on empty input while a change is pending (changing='1')", async () => {
        const user = userEvent.setup();
        const onClickValue = jest.fn();
        renderDropdown({ value: "", changing: "1", onClickValue, onChange: jest.fn(), onBlur: jest.fn() });
        await user.click(screen.getByRole('textbox'));
        await user.keyboard('{Backspace}');
        expect(onClickValue).not.toHaveBeenCalledWith("key", "Backspace", null);
    });
});

describe('multi-select mode', () => {
    it("wraps input and chips in mddBox when input-class children are present", () => {
        renderDropdown({
            onChange: jest.fn(),
            onBlur: jest.fn(),
            children: [
                <div key="chip" className="input">Selected Item</div>,
                <div key="popup" className="popup">Option</div>,
            ]
        });
        expect(document.querySelector('.mddBox')).toBeInTheDocument();
    });

    it("does not render mddBox without input-class children", () => {
        renderDropdown({ onChange: jest.fn(), onBlur: jest.fn() });
        expect(document.querySelector('.mddBox')).not.toBeInTheDocument();
    });
});

describe('focus retention on mousedown', () => {
    it("clicking a popup option calls onBlur and keeps focus on the input", async () => {
        const user = userEvent.setup();
        const drawer = document.createElement('div');
        document.body.appendChild(drawer);
        const onBlur = jest.fn();
        renderDropdown({
            open: true,
            onChange: jest.fn(),
            onBlur,
            drawerEl: drawer,
            children: [
                <div key="opt1" className="popup">Option A</div>,
                <div key="opt2" className="popup">Option B</div>,
            ]
        });
        const input = screen.getByRole('textbox');
        await user.click(input);
        await user.click(screen.getByText('Option A'));
        expect(onBlur).toHaveBeenCalled();
        expect(input).toHaveFocus();
        document.body.removeChild(drawer);
    });

    it("clicking a chip in mddBox keeps focus on the text input", async () => {
        const user = userEvent.setup();
        renderDropdown({
            onChange: jest.fn(),
            onBlur: jest.fn(),
            children: [<div key="chip" className="input" tabIndex={0}>Selected Item</div>]
        });
        const input = screen.getByRole('textbox');
        await user.click(input);
        await user.click(screen.getByText('Selected Item'));
        expect(input).toHaveFocus();
    });
});
