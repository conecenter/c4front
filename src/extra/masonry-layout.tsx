import React, { ReactElement, ReactNode } from "react";
import GridLayout from 'react-grid-layout';

interface MasonryLayout {
    layout?: GridLayout.Layout[],
    children?: ReactNode
}

function MasonryLayout({ layout, children }: MasonryLayout) {
    const childrenArray = React.Children.toArray(children) as ReactElement<{ gridId?: string }>[];

    return (
        <GridLayout layout={layout} className="layout" cols={6} rowHeight={30} width={1200}>
            {layout?.map((item) => {
                const child = childrenArray.find((child) => child.props.gridId === item.i);
                return child && <div key={item.i} data-grid={item} >{child}</div>;
            })}
        </GridLayout>
    );
}

export { MasonryLayout };