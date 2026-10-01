import React from 'react';
import { NoCaptionContext } from '../../main/vdom-hooks';
import { DashboardCard } from './dashboard-card';
import { DashboardHeaderProps } from 'types/c4gen.FrontTags';

const DashboardHeader = ({ heading, addButton }: DashboardHeaderProps) => (
    <NoCaptionContext.Provider value={true}>
        <div className='dashboardHeader'>
            <h1>{heading}</h1>
            <div className='flexibleRow'>{addButton}</div>
        </div>
    </NoCaptionContext.Provider>
);

export const tcsDashboardComponents = { DashboardHeader, DashboardCard };