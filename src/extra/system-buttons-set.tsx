import React, { ReactElement } from 'react';
import { flexibleComponents } from './view-builder/flexible-elements'
import { Align } from 'types/c4gen.CommonElementsApi';

const { ThinFlexibleRow } = flexibleComponents;


interface SystemButtonsSet {
    key: string,
    align?: Align,
    children: ReactElement[]
}

const SystemButtonsSet = ({align = 'l', children}: SystemButtonsSet) => (
    <ThinFlexibleRow key='systemBtnsSet' align={align} className='systemButtonsSet' >
        {children}
    </ThinFlexibleRow>
);

export { SystemButtonsSet };