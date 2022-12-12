import React, { ReactNode } from 'react';
import { NoCaptionContext } from '../../main/vdom-hooks';
import { DashboardCard } from './dashboard-card';

interface DashboardHeader {
    heading: string,
    addButton: ReactNode
}

const DashboardHeader = ({ heading, addButton }: DashboardHeader) => (
    <NoCaptionContext.Provider value={true}>
        <div className='dashboardHeader'>
            <h1>{heading}</h1>
            <div className='flexibleRow'>{addButton}</div>
        </div>
    </NoCaptionContext.Provider>
);

export const tcsDashboardComponents = { DashboardHeader, DashboardCard };