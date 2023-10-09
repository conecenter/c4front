import React, { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { NumberFormattingInput } from "../../extra/number-formatting-input";
import { createSyncProviders } from "../../main/vdom-hooks";

interface App {
  children: ReactNode
}

function App({ children }: App) {
  const sender = {
      enqueue: jest.fn(),
      ctxToPath: () => '/test'
  };
  const ack: boolean | null = null;
  const isRoot = true;

  return createSyncProviders({sender, ack, isRoot, children});
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
    await user.type(input, '123');
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