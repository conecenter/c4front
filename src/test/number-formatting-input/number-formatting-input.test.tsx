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
      enqueue: (identity: any, patch: any) => console.log(patch),
      ctxToPath: () => '/test'
  };
  const ack: boolean | null = null;
  const isRoot = true;

  return createSyncProviders({sender, ack, isRoot, children});
}

describe('basic functionality', () => {
  it("renders input", () => {
    render(<NumberFormattingInput identity={{ key: 'test' }} state={{ number: ''}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('correctly inputs data', async () => {
    const user = userEvent.setup();
    render(
      <App>
        <NumberFormattingInput identity={{ key: 'test' }} state={{ number: ''}} />
      </App>
    );
    const input = screen.getByRole('textbox');
    await user.type(input, '123');
    expect(input).toHaveValue('123');
  });
});
