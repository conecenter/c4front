import React, { ReactNode } from 'react';
import { NoCaptionContext } from '../../main/vdom-hooks';


interface DashboardCard {
    iconFieldItems?: ReactNode,
    nameFieldItems: ReactNode,
    innerItems: ReactNode,
    rightButton: ReactNode
}

const DashboardCard = ({iconFieldItems, nameFieldItems, innerItems, rightButton}: DashboardCard) => (
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