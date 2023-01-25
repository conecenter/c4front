import React, { ReactNode } from 'react';
import { FlexibleAlign, FlexibleChildAlign } from './view-builder/flexible-api';
import { flexibleComponents } from './view-builder/flexible-elements'

const { ThinFlexibleRow } = flexibleComponents;


interface SystemButtonsSet {
    key: string,
    align?: FlexibleAlign,
    children: ReactNode & FlexibleChildAlign
}

const SystemButtonsSet = ({align = 'l', children}: SystemButtonsSet) => (
    <ThinFlexibleRow key='systemBtnsSet' align={align} className='systemButtonsSet' >
        {children}
    </ThinFlexibleRow>
);

export { SystemButtonsSet };