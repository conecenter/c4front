import { PropsWithChildren, createElement as $ } from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import { getAlignedLayout } from "../../extra/masonry-layout/masonry-layout";

const BREAKPOINTS = { lg: 1880, sm: 768 };
const CHILDREN = [
  $('div', { key: 'a' }),
  $('div', { key: 'b' })
];
const BASIC_LAYOUT = {
  lg: [
    { i: "a", x: 0, y: 0, w: 2, h: 5, minW: 2 },
    { i: "b", x: 0, y: 0, w: 2, h: 5, minW: 2 }
],
sm: [
    { i: "a", x: 0, y: 0, w: 1, h: 5, minW: 1 },
    { i: "b", x: 0, y: 0, w: 1, h: 5, minW: 1 }
  ]
}

describe('getAlignedLayout() works correctly', () => {
  it('handles initial layoutServerState {}', () => {
    const alignedLayout = getAlignedLayout({}, BREAKPOINTS, jest.fn(), CHILDREN);
    expect(alignedLayout).toEqual({
      lg: [
          { i: "a", x: 0, y: 0, w: 2, h: 5, minW: 2 },
          { i: "b", x: 0, y: 0, w: 2, h: 5, minW: 2 }
      ],
      sm: [
        { i: "a", x: 0, y: 0, w: 1, h: 5, minW: 1 },
        { i: "b", x: 0, y: 0, w: 1, h: 5, minW: 1 }
      ]
    })
  });

  it('handles undefined children', () => {
    const alignedLayout = getAlignedLayout(BASIC_LAYOUT, BREAKPOINTS, jest.fn());
    expect(alignedLayout).toEqual({});
  });

  it('handles child removal', () => {
    const alignedLayout = getAlignedLayout(BASIC_LAYOUT, BREAKPOINTS, jest.fn(), [CHILDREN[1]]);
    expect(alignedLayout).toEqual({
      lg: [
          { i: "b", x: 0, y: 0, w: 2, h: 5, minW: 2 }
      ],
      sm: [
        { i: "b", x: 0, y: 0, w: 1, h: 5, minW: 1 }
      ]
    })
  });

  it('handles child addition', () => {
    const alignedLayout = getAlignedLayout(BASIC_LAYOUT, BREAKPOINTS, jest.fn(), [CHILDREN[0], CHILDREN[1], $('div', { key: 'c' })]);
    expect(alignedLayout).toEqual({
      lg: [
          { i: "a", x: 0, y: 0, w: 2, h: 5, minW: 2 },
          { i: "b", x: 0, y: 0, w: 2, h: 5, minW: 2 },
          { i: "c", x: 0, y: 0, w: 2, h: 5, minW: 2 }
      ],
      sm: [
        { i: "a", x: 0, y: 0, w: 1, h: 5, minW: 1 },
        { i: "b", x: 0, y: 0, w: 1, h: 5, minW: 1 },
        { i: "c", x: 0, y: 0, w: 1, h: 5, minW: 1 }
      ]
    })
  });
});