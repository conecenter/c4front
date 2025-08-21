import React from "react";
import { render, screen } from "@testing-library/react";
import { BottomBarManager } from "../../extra/bottom-bar/bottom-bar-manager";
import { BottomBarElement } from "../../extra/bottom-bar/bottom-bar-element";

describe('basic functionality', () => {
  it("renders bottom bar content", async () => {
    render(
      <BottomBarManager>
          <BottomBarElement id='0'>
            <button>Button-0</button>
          </BottomBarElement>
      </BottomBarManager>
    );
    expect(await screen.findByRole('button')).toBeInTheDocument();
  });

  it("register/deregister bottom bar content", async () => {
    const btn0 = 'Button-0';
    const btn1 = 'Button-1';
    function App({ id }: { id: string }) {
      return (
        <BottomBarManager>
          <BottomBarElement id={id}>
            <button>{id === '0' ? btn0 : btn1}</button>
          </BottomBarElement>
        </BottomBarManager>
      );
    }
    const {rerender} = render(<App id="0" />);
    rerender(<App id="1" />);
    expect(screen.queryByText(btn0)).not.toBeInTheDocument();
    expect(await screen.findByText(btn1)).toBeInTheDocument();
  });
});