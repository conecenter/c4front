import React from 'react';
import { NoCaptionContext } from '../../main/vdom-hooks';
import { DashboardCardProps } from 'c4f/sapi/ee/cone/c4ui/c4gen.FrontTags';

const DashboardCard = ({iconFieldItems, nameFieldItems, innerItems, rightButton}: DashboardCardProps) => (
    <div className='dashboardCard'>
        <NoCaptionContext.Provider value={true}>
            <div className='cardMainPart'>
                <div>
                    <div className='cardIconField'>{iconFieldItems}</div>
                    <div className='cardNameField'>{nameFieldItems}</div>
                </div>
                <div className='cardInnerItems'>{innerItems}</div>
            </div>
            <div className='cardRightButton'>{rightButton}</div>
        </NoCaptionContext.Provider>
    </div>
);

export { DashboardCard };