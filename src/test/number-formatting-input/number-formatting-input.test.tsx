import React, { PropsWithChildren } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { NumberFormattingInput, parseInputValue } from "../../extra/number-formatting-input";
import { createSyncProviders } from "../../main/vdom-hooks";

function App(props: PropsWithChildren<any>) {
  const sender = {enqueue: jest.fn(), ctxToPath: () => '/test'};
  return createSyncProviders({sender, ack: null, isRoot: true, children: props.children});
}

const DEFAULT_PROPS: NumberFormattingInput = {
  identity: { key: 'test' },
  state: { number: '' },
  showThousandSeparator: false,
  scale: 2,
  minFraction: 2
}

const renderWithProps = (props: NumberFormattingInput) => {
  render(
    <App>
      <NumberFormattingInput {...props} />
    </App>
  );
}

describe('basic functionality', () => {
  it("renders input", () => {
    renderWithProps({ ...DEFAULT_PROPS });
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('correctly inputs data', async () => {
    const user = userEvent.setup();
    renderWithProps({ ...DEFAULT_PROPS, state: { number: '' } });
    const input = screen.getByRole('textbox');
    await act(() => user.type(input, '123'));
    expect(input).toHaveValue('123');
  });
});

describe('number formatting logic - thousands (initial render)', () => {
  it("doesn't format thousands when showThousandSeparator === false", () => {
    renderWithProps({ ...DEFAULT_PROPS, state: { number: 1234 }, showThousandSeparator: false });
    expect(screen.getByRole('textbox')).toHaveValue('1234');
  });

  it('correctly formats thousands - num < 1000', () => {
    renderWithProps({ ...DEFAULT_PROPS, state: { number: 123 }, showThousandSeparator: true });
    expect(screen.getByRole('textbox')).toHaveValue('123');
  });

  it('correctly formats thousands - 10x3 < num < 10x6', () => {
    renderWithProps({ ...DEFAULT_PROPS, state: { number: 1234 }, showThousandSeparator: true });
    expect(screen.getByRole('textbox')).toHaveValue('1,234');
  });

  it('correctly formats thousands - num > 10x6', () => {
    renderWithProps({ ...DEFAULT_PROPS, state: { number: 1234567 }, showThousandSeparator: true });
    expect(screen.getByRole('textbox')).toHaveValue('1,234,567');
  });

  it('correctly formats negative numbers', () => {
    renderWithProps({ ...DEFAULT_PROPS, state: { number: -1234 }, showThousandSeparator: true });
    expect(screen.getByRole('textbox')).toHaveValue('-1,234');
  });
});

describe('number formatting - decimal part (initial render)', () => {
  it('scale > minFraction', () => {
    renderWithProps({ ...DEFAULT_PROPS, state: { number: 0.123 }, scale: 2, minFraction: 1 });
    expect(screen.getByRole('textbox')).toHaveValue('0.12');
  });

  it('scale === minFraction', () => {
    renderWithProps({ ...DEFAULT_PROPS, state: { number: 0.123 }, scale: 2, minFraction: 2 });
    expect(screen.getByRole('textbox')).toHaveValue('0.12');
  });

  it('scale < minFraction', () => {
    renderWithProps({ ...DEFAULT_PROPS, state: { number: 0.123 }, scale: 1, minFraction: 2 });
    expect(screen.getByRole('textbox')).toHaveValue('0.10');
  });

  it('correctly formats negative numbers', () => {
    renderWithProps({ ...DEFAULT_PROPS, state: { number: -0.12 }, scale: 1, minFraction: 1 });
    expect(screen.getByRole('textbox')).toHaveValue('-0.1');
  });
});

describe('number full formatting', () => {
  it('correctly formats complex numbers on initial render', () => {
    renderWithProps({ ...DEFAULT_PROPS, state: { number: -1234.123 }, showThousandSeparator: true, scale: 1, minFraction: 2 });
    expect(screen.getByRole('textbox')).toHaveValue('-1,234.10');
  });

  it('correctly formats complex numbers on blur', async () => {
    const user = userEvent.setup();
    renderWithProps({ ...DEFAULT_PROPS, showThousandSeparator: true, scale: 1, minFraction: 2 });
    const input = screen.getByRole('textbox');
    await act(() => user.type(input, '-1234.123'));
    await user.click(document.body);
    expect(input).toHaveValue('-1,234.10');
  });
});

describe('focus in logic', () => {
  it("doesn't show thousands separator", async () => {
    const user = userEvent.setup();
    renderWithProps({ ...DEFAULT_PROPS, state: { number: 1234 }, showThousandSeparator: true });
    const input = screen.getByRole('textbox');
    await act(() => user.click(input));
    expect(input).toHaveValue('1234');
  });

  it("doesn't show trailing zeroes", async () => {
    const user = userEvent.setup();
    renderWithProps({ ...DEFAULT_PROPS, state: { number: 1.23 }, scale: 2, minFraction: 3 });
    const input = screen.getByRole('textbox');
    await act(() => user.click(input));
    expect(input).toHaveValue('1.23');
  });

  it("keeps cursor at the same position", async () => {
    const user = userEvent.setup();
    renderWithProps({ ...DEFAULT_PROPS, state: { number: 1234567.12 }, showThousandSeparator: true });
    const input = screen.getByRole<HTMLInputElement>('textbox');
    await act(() => user.pointer({target: input, offset: 8, keys: '[MouseLeft]'}));
    expect(screen.getByRole<HTMLInputElement>('textbox').selectionStart).toBe(6);
  });
});

describe('input validation logic', () => {
  it('inhibits input of incorrect symbols', async () => {
    const user = userEvent.setup();
    renderWithProps({ ...DEFAULT_PROPS });
    const input = screen.getByRole('textbox');
    await act(() => user.type(input, '-A10. /,'));
    expect(input).toHaveValue('-10. ,');
  });
});

describe('input parsing logic', () => {
  it('leaves "-" only in the beginning of number', () => {
    const parsedValue = parseInputValue(' -1-2', '.');
    expect(parsedValue).toBe(-12);
  });

  it('removes all non-digits except first decimal separator', () => {
    const parsedValue = parseInputValue('1.2.- 3', '.');
    expect(parsedValue).toBe(1.23);
  });

  it('replaces decimal separator for .', () => {
    const parsedValue = parseInputValue('1,2', ',');
    expect(parsedValue).toBe(1.2);
  });

  it('removes leading/trailing whitespace & trailing decimal 0', () => {
    const parsedValue = parseInputValue('  10.200 ', '.');
    expect(parsedValue).toBe(10.2);
  });

  it('correctly parses empty string', () => {
    const parsedValue = parseInputValue('', '.');
    expect(parsedValue).toBe('');
  });

  it('correctly parses complex input', () => {
    const parsedValue = parseInputValue(' -12,3. 4.-50', '.');
    expect(parsedValue).toBe(-123.45);
  });
});